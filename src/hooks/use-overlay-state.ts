import { useRouter, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

export const OVERLAY_PARAM = "overlay";
export const OVERLAY_ARG_PARAM = "overlayArg";

type OverlayOwner = { id: string; token: object } | null;

// Tracks which hook instance opened an overlay. Several instances can share
// one key (e.g. the appearance trigger in the topbar and in the menu): only
// the opener renders its content, the rest stay shut.
let overlayOwner: OverlayOwner = null;

export function readOverlayValue(
  search: Record<string, unknown>,
  id: string,
): string | null {
  if (search[OVERLAY_PARAM] !== id) {
    return null;
  }
  return readOverlayArg(search);
}

export function readUrlFlag(
  search: Record<string, unknown>,
  param: string,
): string | null {
  return search[param] == null ? null : "";
}

function readOverlayArg(search: Record<string, unknown>): string {
  // The router JSON-parses query values, so numeric ids arrive as numbers.
  const arg = search[OVERLAY_ARG_PARAM];
  if (typeof arg === "string") {
    return arg;
  }
  if (typeof arg === "number" || typeof arg === "boolean") {
    return String(arg);
  }
  return "";
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
 * Each overlay owns its value: transient dialogs share `?overlay=<id>` (plus
 * `?overlayArg=<arg>`), so opening one replaces the other; the menu instead
 * uses its own `?menu=1` flag (`{ param: "menu" }`) and stays mounted beneath
 * dialogs. Opening pushes a history entry, closing goes back (when this
 * instance pushed the entry) or strips the params with a replace (deep links
 * and restored entries), so Back walks the stack one overlay at a time.
 *
 * Returns `[value, setValue]`: `null` means closed, `""` open without an
 * argument, otherwise open with that argument (e.g. a selected item id).
 */
export function useOverlayState(
  id: string,
  options?: { param?: string },
): readonly [string | null, (value: string | null) => void] {
  const param = options?.param ?? OVERLAY_PARAM;
  const shared = param === OVERLAY_PARAM;
  const ownerKey = shared ? id : param;
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

  const urlValue = shared
    ? readOverlayValue(search, id)
    : readUrlFlag(search, param);
  const ownedElsewhere =
    overlayOwner !== null &&
    overlayOwner.id === ownerKey &&
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
      const raw = location.search as Record<string, unknown>;
      const freshValue = shared
        ? readOverlayValue(raw, id)
        : readUrlFlag(raw, param);
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
      overlayOwner = { id: ownerKey, token };
      pushedRef.current = true;
      const params = serializeSearch(raw);
      if (shared) {
        params.set(OVERLAY_PARAM, id);
        if (next === "") {
          params.delete(OVERLAY_ARG_PARAM);
        } else {
          params.set(OVERLAY_ARG_PARAM, next);
        }
      } else {
        params.set(param, "1");
      }
      const query = params.toString();
      // location.hash excludes the leading "#".
      const hash = location.hash ? `#${location.hash}` : "";
      router.history.push(
        `${location.pathname}${query ? `?${query}` : ""}${hash}`,
      );
    },
    [id, ownerKey, param, router, shared, token],
  );

  return [value, setValue] as const;
}
