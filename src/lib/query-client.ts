// Local-first QueryClient: persisted cache, stale-while-revalidate defaults,
// and offline-first networking so the app paints instantly and works in dead zones.

import { QueryClient } from "@tanstack/react-query";

import { idb } from "@/lib/idb";
import { replayOutbox } from "@/lib/outbox";

const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_PERSISTED_QUERIES = 200;

function persistable(queryKey: unknown): boolean {
  return (
    Array.isArray(queryKey) && (queryKey[0] === "my" || queryKey[0] === "me")
  );
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cache instantly, revalidate quietly in the background.
      staleTime: 60_000,
      gcTime: PERSIST_MAX_AGE,
      retry: 1,
      refetchOnWindowFocus: false,
      // Offline: resolve from cache instead of erroring.
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: 0,
      networkMode: "offlineFirst",
    },
  },
});

function stableKey(queryKey: readonly unknown[]): string {
  return JSON.stringify(queryKey);
}

/** Hydrate the cache from IndexedDB. Resolves fast (empty when nothing stored). */
export async function restoreQueryCache(): Promise<void> {
  if (!idb) {
    return;
  }
  try {
    const rows = await idb.getAllCachedQueries();
    const now = Date.now();
    for (const row of rows) {
      if (
        !Array.isArray(row.queryKey) ||
        now - row.updatedAt > PERSIST_MAX_AGE
      ) {
        continue;
      }
      queryClient.setQueryData([...row.queryKey], row.data, {
        updatedAt: row.updatedAt,
      });
    }
  } catch {
    // Corrupt or unavailable storage must never break boot.
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Continuously mirror successful my/me queries into IndexedDB (throttled). */
export function startQueryPersistence(): void {
  if (!idb || typeof window === "undefined") {
    return;
  }
  queryClient.getQueryCache().subscribe(() => {
    if (saveTimer) {
      return;
    }
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void (async () => {
        try {
          const rows = queryClient
            .getQueryCache()
            .findAll({ predicate: (q) => q.state.status === "success" })
            .filter((q) => persistable(q.queryKey))
            .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
            .slice(0, MAX_PERSISTED_QUERIES)
            .map((q) => ({
              key: stableKey(q.queryKey),
              queryKey: [...q.queryKey],
              data: q.state.data,
              updatedAt: q.state.dataUpdatedAt,
            }));
          await idb?.clearCachedQueries();
          await idb?.putCachedQueries(rows);
        } catch {
          // Persistence is best-effort; the network remains the source of truth.
        }
      })();
    }, 1500);
  });
}

/**
 * Boot sequence for local-first: restore cache, replay any mutations that were
 * queued while offline, then keep persistence running.
 */
export async function initLocalFirst(): Promise<void> {
  await restoreQueryCache();
  startQueryPersistence();
  // Replay in the background: queued mutations must never delay first paint.
  void replayOutbox(queryClient);
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      void replayOutbox(queryClient);
    });
  }
}
