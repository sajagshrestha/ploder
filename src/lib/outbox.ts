// Offline outbox: mutations that can't reach the server are queued in
// IndexedDB and replayed in order on reconnect (or next boot). Every entry
// carries a stable idempotency key, so a replayed request can never apply twice
// — the server dedupes on (user, key).

import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import { idb, type OutboxEntry } from "@/lib/idb";

export type MutationDescriptor = {
  method: string;
  path: string;
  body?: string;
  label: string;
};

let replaying = false;

export async function replayOutbox(
  queryClient: QueryClient,
): Promise<{ synced: number }> {
  if (
    !idb ||
    replaying ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return { synced: 0 };
  }
  replaying = true;
  try {
    const entries = await idb.listOutbox();
    let synced = 0;
    for (const entry of entries) {
      if (entry.id === undefined) {
        continue;
      }
      try {
        await apiFetch(entry.path, {
          method: entry.method,
          body: entry.body,
          headers: { "Idempotency-Key": entry.key },
        });
        synced += 1;
      } catch (error) {
        // Still offline (or server down): stop and retry on next reconnect.
        if (
          error instanceof TypeError ||
          (typeof navigator !== "undefined" && !navigator.onLine)
        ) {
          break;
        }
        // A definitive server rejection (4xx/5xx) will never succeed —
        // drop it so one bad entry can't block the queue behind it.
      }
      await idb.removeOutbox(entry.id);
    }
    if (synced > 0) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my"] }),
        queryClient.invalidateQueries({ queryKey: ["me"] }),
      ]);
      toast.success(synced === 1 ? "Synced" : `Synced ${synced}`);
    }
    return { synced };
  } finally {
    replaying = false;
  }
}

export async function enqueueOutbox(
  entry: Omit<OutboxEntry, "id" | "createdAt">,
): Promise<void> {
  if (!idb) {
    return;
  }
  await idb.enqueueOutbox({ ...entry, createdAt: Date.now() });
}

export async function dequeueOutboxByKey(key: string): Promise<void> {
  if (!idb) {
    return;
  }
  const entries = await idb.listOutbox();
  await Promise.all(
    entries
      .filter((entry) => entry.key === key && entry.id !== undefined)
      .map((entry) => idb?.removeOutbox(entry.id as number)),
  );
}
