export type ThemeMode = "light" | "dark" | "system";
export type ThemePalette = "lime" | "rose" | "ocean" | "iris";
export const THEME_KEY = "ploder-theme";
export const PALETTE_KEY = "ploder-palette";
export const LEGACY_PALETTES: Record<string, ThemePalette> = {
  neutral: "lime",
  emerald: "lime",
  amber: "lime",
  blue: "ocean",
  violet: "iris",
};
export const PALETTES: {
  value: ThemePalette;
  name: string;
  description: string;
}[] = [
  { value: "lime", name: "Lime", description: "Fresh greens" },
  { value: "rose", name: "Rose", description: "Soft pinks" },
  { value: "ocean", name: "Ocean", description: "Cool blues" },
  { value: "iris", name: "Iris", description: "Gentle purples" },
];
export function resolvePalette(
  value: string | null,
  legacy: string | null,
): ThemePalette {
  return (
    PALETTES.find((palette) => palette.value === value)?.value ??
    (legacy && Object.hasOwn(LEGACY_PALETTES, legacy)
      ? LEGACY_PALETTES[legacy]
      : undefined) ??
    "lime"
  );
}
export function resolveMode(value: string | null): ThemeMode {
  return value === "light" || value === "dark" ? value : "system";
}
// Run before first paint; keep the migration identical to the provider.
export const THEME_INIT_SCRIPT = `(function(){var r=document.documentElement;var m='system',p='lime';try{var s=localStorage.getItem('${THEME_KEY}');m=s==='light'||s==='dark'?s:'system';var v=localStorage.getItem('${PALETTE_KEY}');p=${JSON.stringify(PALETTES.map((palette) => palette.value))}.indexOf(v)>=0?v:(Object.entries(${JSON.stringify(LEGACY_PALETTES)}).find(function(e){return e[0]===localStorage.getItem('ploder-accent')})||['','lime'])[1]}catch(e){}var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';r.setAttribute('data-palette',p);r.removeAttribute('data-accent')})();`;
