import { Moon, Palette, Sun } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeMode = "light" | "dark" | "system";
type Accent = "neutral" | "violet" | "blue" | "emerald" | "amber";

const THEME_KEY = "ploder-theme";
const ACCENT_KEY = "ploder-accent";

export const ACCENTS: { value: Accent; label: string; swatch: string }[] = [
  { value: "neutral", label: "Neutral", swatch: "#171717" },
  { value: "violet", label: "Violet", swatch: "#7c5cff" },
  { value: "blue", label: "Blue", swatch: "#3b82f6" },
  { value: "emerald", label: "Emerald", swatch: "#10b981" },
  { value: "amber", label: "Amber", swatch: "#f59e0b" },
];

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(mode: ThemeMode, accent: Accent) {
  const root = document.documentElement;
  const dark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  if (accent === "neutral") {
    delete root.dataset.accent;
  } else {
    root.dataset.accent = accent;
  }
}

function initialMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

function initialAccent(): Accent {
  if (typeof window === "undefined") {
    return "neutral";
  }
  const stored = localStorage.getItem(ACCENT_KEY);
  return ACCENTS.some((accent) => accent.value === stored)
    ? (stored as Accent)
    : "neutral";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [accent, setAccent] = useState<Accent>(initialAccent);

  useEffect(() => {
    applyTheme(mode, accent);
    localStorage.setItem(THEME_KEY, mode);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [mode, accent]);

  useEffect(() => {
    if (mode !== "system") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system", accent);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [mode, accent]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export function ThemeToggle() {
  const { mode, setMode, accent, setAccent } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <Button
        aria-label="Toggle dark mode"
        onClick={() => setMode(mode === "dark" ? "light" : "dark")}
        size="icon"
        variant="ghost"
      >
        <Moon className="hidden size-4 dark:block" />
        <Sun className="block size-4 dark:hidden" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="Change accent color" size="icon" variant="ghost">
            <Palette className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            onValueChange={(value) => setMode(value as ThemeMode)}
            value={mode}
          >
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Accent</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            onValueChange={(value) => setAccent(value as Accent)}
            value={accent}
          >
            {ACCENTS.map((item) => (
              <DropdownMenuRadioItem key={item.value} value={item.value}>
                <span
                  className="mr-1 inline-block size-3 rounded-full"
                  style={{ backgroundColor: item.swatch }}
                />
                {item.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
