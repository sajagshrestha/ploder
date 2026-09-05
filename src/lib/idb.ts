// Minimal IndexedDB wrapper for local-first persistence (no dependencies).
// Stores: query-cache (persisted TanStack Query data), outbox (queued mutations).

const DB_NAME = "ploder-local";
const DB_VERSION = 1;

export type CachedQuery = {
  key: string;
  queryKey: readonly unknown[];
  data: unknown;
  updatedAt: number;
};

export type OutboxEntry = {
  id?: number;
  key: string;
  method: string;
  path: string;
  body?: string;
  label: string;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("query-cache")) {
        db.createObjectStore("query-cache", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(
  store: "query-cache" | "outbox",
  mode: IDBTransactionMode,
  run: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => {
          resolve(request.result);
          db.close();
        };
        request.onerror = () => {
          reject(request.error);
          db.close();
        };
      }),
  );
}

export const idb =
  typeof indexedDB === "undefined"
    ? null
    : {
        async getAllCachedQueries(): Promise<CachedQuery[]> {
          const rows = await tx("query-cache", "readonly", (store) =>
            store.getAll(),
          );
          return (rows ?? []) as CachedQuery[];
        },
        async putCachedQueries(rows: CachedQuery[]): Promise<void> {
          if (rows.length === 0) {
            return;
          }
          const db = await openDb();
          await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction("query-cache", "readwrite");
            const objectStore = transaction.objectStore("query-cache");
            for (const row of rows) {
              objectStore.put(row);
            }
            transaction.oncomplete = () => {
              resolve();
              db.close();
            };
            transaction.onerror = () => {
              reject(transaction.error);
              db.close();
            };
          });
        },
        async clearCachedQueries(): Promise<void> {
          const db = await openDb();
          await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction("query-cache", "readwrite");
            transaction.objectStore("query-cache").clear();
            transaction.oncomplete = () => {
              resolve();
              db.close();
            };
            transaction.onerror = () => {
              reject(transaction.error);
              db.close();
            };
          });
        },
        async listOutbox(): Promise<OutboxEntry[]> {
          const rows = await tx("outbox", "readonly", (store) =>
            store.getAll(),
          );
          return ((rows ?? []) as OutboxEntry[]).sort(
            (a, b) => (a.id ?? 0) - (b.id ?? 0),
          );
        },
        async enqueueOutbox(entry: Omit<OutboxEntry, "id">): Promise<void> {
          await tx("outbox", "readwrite", (store) => store.add(entry));
          window.dispatchEvent(new CustomEvent("ploder:outbox"));
        },
        async removeOutbox(id: number): Promise<void> {
          await tx("outbox", "readwrite", (store) => store.delete(id));
          window.dispatchEvent(new CustomEvent("ploder:outbox"));
        },
      };
