import { useEffect, useState } from "react";

/**
 * Returns `value` delayed by `delay` milliseconds. The returned value only
 * updates after `value` has stayed unchanged for the full delay, so typing
 * stays instant in the input while expensive work (server queries, URL
 * updates) runs against the settled text.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
