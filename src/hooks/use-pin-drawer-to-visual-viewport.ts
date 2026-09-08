import { useEffect } from "react";

/**
 * Pins a full-screen bottom drawer to the visible viewport while the
 * on-screen keyboard is open.
 *
 * A `position: fixed; bottom: 0` drawer gets shoved upward when the keyboard
 * appears, sliding its top content out of view. By sizing the drawer to
 * `visualViewport` (top offset + visible height) only while the keyboard
 * covers part of the screen, the top stays put and the keyboard simply
 * overlays the drawer's bottom edge.
 */
export function usePinDrawerToVisualViewport(
  open: boolean,
  selector: string,
): void {
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return;
    const clear = () => {
      element.style.top = "";
      element.style.bottom = "";
      element.style.height = "";
      element.style.minHeight = "";
      element.style.maxHeight = "";
    };
    const update = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      // Ignore small deltas from browser-chrome collapsing; only the
      // keyboard takes a large bite out of the visible viewport.
      if (covered > 40) {
        element.style.top = `${viewport.offsetTop}px`;
        element.style.bottom = "auto";
        element.style.height = `${viewport.height}px`;
        element.style.minHeight = `${viewport.height}px`;
        element.style.maxHeight = `${viewport.height}px`;
      } else {
        clear();
      }
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      clear();
    };
  }, [open, selector]);
}
