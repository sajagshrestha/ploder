import { useRouter, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

export const OVERLAY_PARAM = "overlay";
export const OVERLAY_ARG_PARAM = "overlayArg";

type OverlayOwner = { id: string; token: object } | null;

// Tracks which hook instance opened an overlay. Several instances can share
// one key (e.g. the appearance trigger in the topbar and in the menu): only
// the opener renders its content, the rest stay shut.
let overlayOwner: OverlayOwner = null;

function readValue(search: Record<string, unknown>, id: string): string | null {
  if (search[OVERLAY_PARAM] !== id) {
    return null;
  }
  const arg = search[OVERLAY_ARG_PARAM];
  return typeof arg === "string" ? arg : "";
}

function serializeSearch(search: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
      continue;
    }
    params.set(key, String(value));
  }
  return params;
}

/**
 * Sync a dialog/drawer to the URL so system back navigation closes it.
 *
 * Protocol: opening pushes `?overlay=<id>[&overlayArg=<arg>]`, closing goes
 * back (when this instance pushed the entry) or strips the params with a
 * replace (deep links and restored entries). Opening replaces any other
 * overlay, so Back walks the stack one overlay at a time.
 *
 * Returns `[value, setValue]`: `null` means closed, `""` open without an
 * argument, otherwise open with that argument (e.g. a selected item id).
 */
export function useOverlayState(
  id: string,
): readonly [string | null, (value: string | null) => void] {
  const router = useRouter();
  const search = useRouterState({
    select: (state) => state.location.search,
  }) as Record<string, unknown>;
  const tokenRef = useRef<object | null>(null);
  if (tokenRef.current === null) {
    tokenRef.current = {};
  }
  const token = tokenRef.current;
  const pushedRef = useRef(false);

  const urlValue = readValue(search, id);
  const ownedElsewhere =
    overlayOwner !== null &&
    overlayOwner.id === id &&
    overlayOwner.token !== token;
  const value = urlValue !== null && !ownedElsewhere ? urlValue : null;

  // Drop stale ownership when the URL no longer shows this overlay, and when
  // this instance unmounts, so restored entries still open.
  useEffect(() => {
    if (value === null && overlayOwner?.token === token) {
      overlayOwner = null;
    }
  }, [value, token]);
  useEffect(
    () => () => {
      if (overlayOwner?.token === token) {
        overlayOwner = null;
      }
    },
    [token],
  );

  const setValue = useCallback(
    (next: string | null) => {
      const location = router.state.location;
      const freshValue = readValue(
        location.search as Record<string, unknown>,
        id,
      );
      if (next === null) {
        if (freshValue === null) {
          pushedRef.current = false;
          return;
        }
        pushedRef.current = false;
        if (overlayOwner?.token === token) {
          overlayOwner = null;
        }
        router.history.back();
        return;
      }
      if (freshValue === next) {
        return;
      }
      overlayOwner = { id, token };
      pushedRef.current = true;
      const params = serializeSearch(
        location.search as Record<string, unknown>,
      );
      params.set(OVERLAY_PARAM, id);
      if (next === "") {
        params.delete(OVERLAY_ARG_PARAM);
      } else {
        params.set(OVERLAY_ARG_PARAM, next);
      }
      const query = params.toString();
      router.history.push(
        `${location.pathname}${query ? `?${query}` : ""}${location.hash ?? ""}`,
      );
    },
    [id, router, token],
  );

  return [value, setValue] as const;
}
