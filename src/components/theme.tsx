import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PALETTE_KEY,
  PALETTES,
  resolveMode,
  resolvePalette,
  THEME_KEY,
  type ThemeMode,
  type ThemePalette,
} from "@/lib/theme-preferences";

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
    return { mode: "system" as const, palette: "lime" as const };
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
  const [palette, setPalette] = useState<ThemePalette>("lime");
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
export function ThemeToggle() {
  const { mode, setMode, palette, setPalette } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="appearance-trigger"
          aria-label="Customize appearance"
        >
          <Palette size={17} /> Appearance
        </Button>
      </DialogTrigger>
      <DialogContent className="appearance-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Make it yours</DialogTitle>
          <DialogDescription>
            A palette for your pace. Preview changes instantly.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="appearance-fieldset">
          <legend>Display</legend>
          <div className="appearance-modes">
            {modes.map(({ value, label, icon: Icon }) => (
              <label key={value} data-selected={mode === value}>
                <input
                  type="radio"
                  name="display-mode"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                />
                <Icon size={17} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="appearance-fieldset">
          <legend>Color palette</legend>
          <div className="palette-grid">
            {PALETTES.map((item) => (
              <label
                className="palette-option"
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
                />
                <span
                  className="palette-preview"
                  data-theme-preview={item.value}
                  aria-hidden="true"
                >
                  <span className="palette-preview-bar" />
                  <span className="palette-preview-surface">
                    <span />
                    <span />
                    <b />
                  </span>
                  <span className="palette-preview-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
                <span className="palette-option-caption">
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
        </fieldset>
        <div className="appearance-footer">
          <span>Saved on this device</span>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
