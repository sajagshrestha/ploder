import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/responsive-dialog";
import { useOverlayState } from "@/hooks/use-overlay-state";
import {
  DEFAULT_PALETTE,
  PALETTE_KEY,
  PALETTES,
  resolveMode,
  resolvePalette,
  THEME_KEY,
  type ThemeMode,
  type ThemePalette,
} from "@/lib/theme-preferences";
import { cn } from "@/lib/utils";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);
function readPreferences() {
  try {
    return {
      mode: resolveMode(localStorage.getItem(THEME_KEY)),
      palette: resolvePalette(
        localStorage.getItem(PALETTE_KEY),
        localStorage.getItem("ploder-accent"),
      ),
    };
  } catch {
    return { mode: "system" as const, palette: DEFAULT_PALETTE };
  }
}
function applyTheme(mode: ThemeMode, palette: ThemePalette) {
  const root = document.documentElement;
  const dark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  root.dataset.palette = palette;
  delete root.dataset.accent;
  const color = getComputedStyle(root).getPropertyValue("--background").trim();
  for (const meta of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  ))
    meta.content = color;
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [palette, setPalette] = useState<ThemePalette>(DEFAULT_PALETTE);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => {
      const settings = readPreferences();
      setMode(settings.mode);
      setPalette(settings.palette);
    };
    read();
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (
        event.key === THEME_KEY ||
        event.key === PALETTE_KEY ||
        event.key === null
      )
        read();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!ready) return;
    applyTheme(mode, palette);
    try {
      localStorage.setItem(THEME_KEY, mode);
      localStorage.setItem(PALETTE_KEY, palette);
      localStorage.removeItem("ploder-accent");
    } catch {
      /* Keep the selection usable when storage is unavailable. */
    }
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system", palette);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode, palette, ready]);
  return (
    <ThemeContext.Provider value={{ mode, setMode, palette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
const modes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;
const PALETTES_PER_PAGE = 4;

const palettePages: (typeof PALETTES)[number][][] = [];
for (let i = 0; i < PALETTES.length; i += PALETTES_PER_PAGE) {
  palettePages.push(PALETTES.slice(i, i + PALETTES_PER_PAGE));
}

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode, palette, setPalette } = useTheme();
  const [appearance, setAppearance] = useOverlayState("appearance");
  const open = appearance !== null;
  const setOpen = (next: boolean) => setAppearance(next ? "" : null);
  const [page, setPage] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) {
      setPage(0);
      gridRef.current?.scrollTo({ left: 0 });
    }
  }, [open]);
  const onGridScroll = () => {
    const grid = gridRef.current;
    if (!grid) return;
    const index = Math.min(
      palettePages.length - 1,
      Math.max(0, Math.round(grid.scrollLeft / grid.clientWidth)),
    );
    setPage((current) => (current === index ? current : index));
  };
  const goToPage = (index: number) => {
    gridRef.current?.scrollTo({
      left: index * gridRef.current.clientWidth,
      behavior: "smooth",
    });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={cn("min-h-11 gap-2", className)}
          aria-label="Customize appearance"
        >
          <Palette size={17} /> Appearance
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-[22px] overflow-y-auto max-mobile:gap-5 data-[slot=drawer-content]:overflow-y-visible data-[slot=drawer-content]:px-5 max-mobile:data-[slot=drawer-content]:pb-[max(32px,env(safe-area-inset-bottom))] sm:max-w-lg [&_[data-slot=drawer-header]]:px-0">
        <DialogHeader>
          <DialogTitle>Make it yours</DialogTitle>
          <DialogDescription>
            A palette for your pace. Preview changes instantly.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="min-w-0 [&_legend]:mb-[10px] [&_legend]:text-xs [&_legend]:font-bold [&_legend]:text-muted-foreground">
          <legend>Display</legend>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {modes.map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                data-selected={mode === value}
                className="relative flex min-h-11 cursor-pointer items-center justify-center gap-[7px] rounded-[9px] text-xs text-muted-foreground focus-within:outline-2 focus-within:outline-ring focus-within:outline-offset-[3px] data-[selected=true]:bg-card data-[selected=true]:text-foreground"
              >
                <input
                  type="radio"
                  name="display-mode"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                  className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
                />
                <Icon size={17} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="min-w-0 [&_legend]:mb-[10px] [&_legend]:text-xs [&_legend]:font-bold [&_legend]:text-muted-foreground">
          <legend>Color palette</legend>
          <div
            className="grid grid-cols-2 gap-3 max-mobile:gap-2.5 [[data-slot=drawer-content]_&]:mx-[-20px] [[data-slot=drawer-content]_&]:flex [[data-slot=drawer-content]_&]:gap-0 [[data-slot=drawer-content]_&]:overflow-x-auto [[data-slot=drawer-content]_&]:px-5 [[data-slot=drawer-content]_&]:pb-1 [[data-slot=drawer-content]_&]:[scroll-padding-inline:20px] [[data-slot=drawer-content]_&]:[scroll-snap-type:x_mandatory] [[data-slot=drawer-content]_&]:[scrollbar-width:none] [[data-slot=drawer-content]_&]:[&::-webkit-scrollbar]:hidden"
            ref={gridRef}
            onScroll={onGridScroll}
          >
            {palettePages.map((items) => (
              <div className="palette-page" key={items[0]?.value}>
                {items.map((item) => (
                  <label
                    className="relative grid cursor-pointer gap-2.5 rounded-xl border border-border p-[9px] focus-within:outline-2 focus-within:outline-ring focus-within:outline-offset-[3px] data-[selected=true]:border-ring data-[selected=true]:shadow-[inset_0_0_0_1px_var(--ring)]"
                    key={item.value}
                    data-selected={palette === item.value}
                  >
                    <input
                      type="radio"
                      name="color-palette"
                      aria-label={`${item.name} — ${item.description}`}
                      value={item.value}
                      checked={palette === item.value}
                      onChange={() => setPalette(item.value)}
                      className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <span
                      className="relative flex h-[86px] gap-[7px] overflow-hidden rounded-lg border border-border bg-background p-[10px] max-mobile:h-[74px] max-mobile:p-[7px]"
                      data-theme-preview={item.value}
                      aria-hidden="true"
                    >
                      <span className="h-full w-[15%] rounded bg-accent" />
                      <span className="flex flex-1 flex-col items-start gap-1.5 rounded-[5px] border border-border bg-card p-2 [&>b]:mt-auto [&>b]:block [&>b]:h-3 [&>b]:w-3/5 [&>b]:rounded-[3px] [&>b]:bg-primary [&>span]:h-1 [&>span]:w-3/4 [&>span]:rounded-[2px] [&>span]:bg-muted-foreground [&>span:nth-child(2)]:w-[45%] [&>span:nth-child(2)]:bg-border">
                        <span />
                        <span />
                        <b />
                      </span>
                      <span className="absolute right-[14px] bottom-[14px] flex gap-[3px] [&_i]:size-[5px] [&_i]:rounded-full [&_i]:bg-primary [&_i:nth-child(2)]:bg-accent [&_i:nth-child(3)]:bg-muted-foreground">
                        <i />
                        <i />
                        <i />
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-1 [&_small]:mt-[2px] [&_small]:block [&_small]:text-[11px] [&_small]:text-muted-foreground [&_strong]:block [&_strong]:text-[13px] [&_svg]:shrink-0 [&_svg]:text-chart-1">
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                      </span>
                      {palette === item.value && (
                        <Check size={17} aria-hidden="true" />
                      )}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          {palettePages.length > 1 && (
            <div className="flex h-6 items-center justify-center gap-1 [[data-slot=dialog-content]_&]:hidden">
              {palettePages.map((items, pageIndex) => (
                <button
                  key={items[0]?.value}
                  type="button"
                  data-active={pageIndex === page}
                  aria-label={`Go to page ${pageIndex + 1}`}
                  onClick={() => goToPage(pageIndex)}
                  className="h-[5px] flex-[0_0_24px] cursor-pointer rounded-full border-0 bg-border p-0 transition-[background-color,height] duration-200 data-[active=true]:h-[9px] data-[active=true]:bg-primary"
                />
              ))}
            </div>
          )}
        </fieldset>
      </DialogContent>
    </Dialog>
  );
}
