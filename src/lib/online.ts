import { useEffect, useState, useSyncExternalStore } from "react";

import { idb } from "@/lib/idb";

function subscribeOnline(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** Reactive navigator.onLine. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

/** Number of mutations waiting in the offline outbox. */
export function useOutboxCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void idb?.listOutbox().then((entries) => {
        if (!cancelled) {
          setCount(entries.length);
        }
      });
    };
    refresh();
    const done = () => {
      refresh();
    };
    window.addEventListener("online", done);
    window.addEventListener("ploder:outbox", done);
    return () => {
      cancelled = true;
      window.removeEventListener("online", done);
      window.removeEventListener("ploder:outbox", done);
    };
  }, []);
  return count;
}
