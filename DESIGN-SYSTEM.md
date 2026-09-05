# Ploder Design System

> Agent guide. Follow this file when building or restyling any UI in this repo.
> Theme tokens live on `:root` / `.dark` (not scoped to a wrapper) so portaled
> layers — dialogs, dropdowns, tooltips, toasts — inherit the same palette.
> Source of truth for values: `src/styles.css`.

## 1. Brand tokens

- **Font:** Manrope (`--font-sans`), weights 400–800. Never introduce another font.
- **Palettes:** Lime (fresh greens), Rose (soft pinks), Ocean (cool blues), Iris
  (gentle purples). Each includes coordinated light and dark surfaces, controls,
  borders, focus rings, charts, and activity heatmaps.
- **Root selector:** `:root[data-palette="lime|rose|ocean|iris"]` plus `.dark`.
  Use `--primary` / `--primary-foreground` for actions and `--chart-1` for data.
  Heatmap levels `--heat-0…4` derive from the selected chart color.
- **Preferences:** `src/lib/theme-preferences.ts` defines palette names and the
  first-paint bootstrap. `ThemeProvider` persists mode and palette locally,
  migrates legacy accents, and follows system appearance when selected.
- **Picker:** `ThemeToggle` opens a dialog with visual palette previews and
  Light / Dark / System controls. Selections apply immediately.
- **Rules:** never hardcode hex/rgb outside these tokens — use `var(--*)` in CSS
  or Tailwind `bg-*/text-*/border-*` utilities (they resolve to the same vars via
  `@theme inline`). Every surface must read correctly in both modes.
- **Modals & toasts:** Radix/Sonner render into `document.body` portals, so they
  only follow the theme via the `:root` tokens — never scope palette vars to a
  wrapper div. Dialog/AlertDialog/Sheet content uses `bg-card text-card-foreground`
  (`rounded-[17px]`, `shadow-xl`, blurred `bg-black/55` scrim, scroll-safe
  `max-h-[calc(100dvh-2rem)]`); menus/popovers/toasts use `bg-popover`.
  Titles/descriptions scale globally via `[data-slot="*-title|description"]`
  hooks; footers go full-width ≤700px. Use `ConfirmDialog` (icon tile +
  "Please confirm" eyebrow, red tile for destructive) instead of hand-rolled
  confirms. Toasts tint by variant (lime success, red error, amber warning).

## 2. Type scale

- `.eyebrow` — 9px, 700, 1.6px tracking, uppercase, muted. Section kickers.
- `.page-heading h1` — clamp(24px, 2.35vw, 34px), 700, −1.25px tracking.
  Always paired with `.heading-dot` (palette-colored `.`) and a muted sub-paragraph.
- `.panel-heading h2` — 15px, 700, −0.35px tracking.
- Body text 12–14px; never below 10px except micro-labels.

## 3. Radius & elevation scale

| Use | Radius |
|---|---|
| Buttons, inputs, selects, textarea | **9–10px** |
| Menus, dropdowns, skeleton blocks | **12px** |
| Cards, panels, dialogs, toasts | **15–17px** (`--radius` stays `0.625rem`; surfaces use explicit values) |
| Icon tiles | 11px · Chips/pills | 999px · Small tags | 5–8px |

- Panels/cards: `1px solid var(--border)`, **no drop shadows** (dialogs/menus keep
  their shadow for layering). Focus rings always `var(--ring)`.

## 4. App shell (mandatory layout)

Every top-level route renders:

```tsx
<div className="training-app app-shell">
  <a href="#app-main" className="skip-link">Skip to content</a>
  <aside className="app-sidebar">…brand, .sidebar-label, nav.desktop-navigation…</aside>
  <div className="app-workspace">
    <header className="app-topbar">
      <div className="topbar-breadcrumb">
        <span className="mobile-brand">…</span>
          <span className="topbar-titles">
            <span className="desktop-only topbar-context">Section</span>
            <strong>Page title</strong><!-- 20px, 800, −0.6px tracking -->
          </span>
      </div>
      <div className="topbar-actions">…</div>
    </header>
    <main id="app-main" className="app-main" tabIndex={-1}><Outlet /></main>
    <footer className="app-footer">…</footer>
  </div>
  <nav className="mobile-navigation">…max 5 items…</nav>
</div>
```

- Sidebar 232px fixed desktop, hidden ≤700px (bottom `mobile-navigation` takes over).
- Topbar 80px, **desktop only** (`display: none` ≤700px). Primary actions:
  `.topbar-start` / `.topbar-weighin`.
- Mobile bottom bar = bottom-stuck slab (card surface, top border, safe-area
  padding): 4 uniform icon-only 56px pills (23px icons, `aria-label`s) —
  3 key tabs + hamburger `Menu` button opening the `.mobile-drawer` sheet
  (brand, primary actions, full nav, `ThemeToggle`, `InstallPrompt`, profile).
  Active/menu-open pill uses accent fill, with a press-down scale feedback.
  User app: Home (`House`) / Workout / Progress.
  Admin: Home (`House`) / Exercises / Workouts.
- `PwaRegister` once per shell. `InstallPrompt` in `topbar-actions` + drawer.

## 5. Reusable theme classes (prefer over new CSS)

- **Pages:** `.overview-page` (grid gap 24), `.progress-page`, `.page-heading`,
  `.date-pill`, `.app-empty` (empty states), `.app-loading`, `.inline-error`, `.inline-empty`.
- **Cards:** `.dashboard-panel` (+ `.panel-heading`, `.eyebrow`), `.stat-card`
  (+ `.stat-label`), `.week-panel`, `.session-icon`, `.recent-session-list`,
  `.text-link`, `.icon-link`.
- **Icons:** `.icon-tile` + one color: `lime | peach | purple | blue`
  (gradient fills, 34px, 11px radius — do not resize per usage).
- **Hero:** `.workout-hero` (lime gradient + ghost "TRAIN" type), `.hero-copy`,
  `.hero-tag` (dark pill), `.hero-button` (dark primary), `.hero-secondary`
  (white w/ dark border), `.hero-actions`, `.hero-dumbbell`, `.hero-edition` (dark pill).
- **Forms:** `.form-stack` (18px grid), `.form-help`, `.segmented` (chip radio group),
  `.weighin-*` (stepper, chips, delta, actions). Labels semibold; inputs `h-11`.
- **Data:** `.heatmap-*` (GitHub-style, `data-level="0..4"`), `.progress-chart`,
  `.chart-data`, `.weight-history-list/entry`, `.plan-day-list`, `.day-number`.
- **Train session:** `.session-page` (grid), `.session-top` (minimal bar:
  `.session-type-badge` day pill + `.session-live` elapsed/sets status +
  `.session-icon-btn` solid finish / ghost discard tiles),
  `.session-picker-bar` + `.segmented` view toggle, `.ex-carousel` (snap scroll,
  edge-bleed, 88% tinder-tall cards / 46% desktop, `min-height: min(54dvh, 540px)`)
  + `.ex-card` + `.carousel-nav/dots`,
  `.set-panel/head/list/empty/pad` (stepper pad reuses `.weighin-*`).
  Step transitions via `motion` (`AnimatePresence mode="wait"`, spring slides);
  wrap session roots in `<MotionConfig reducedMotion="user">`.
  Never reuse `.session-status` (overview list chip, hidden on mobile).

## 6. shadcn mapping (already themed — do not revert)

All `src/components/ui/*` ship with theme-aligned styling. Key deltas from stock
new-york: buttons `rounded-[9px]` semibold (`lg` → `h-11`); inputs/selects/textarea
`rounded-[10px]`, `bg-card`, `h-11`, no shadow; cards `rounded-[16px]` shadowless;
dialogs `rounded-[17px]`; menus `rounded-[12px]`, items `rounded-[8px]` semibold
with `py-2` touch targets; badges `rounded-[8px]` semibold (not pills); tabs list
`rounded-[10px]`; table heads semibold muted with `h-11 px-3`; tooltip dark chip
`rounded-[8px]`; toasts 14px radius; labels semibold.

- `sidebar.tsx` is **legacy/unused** (admin uses the custom shell) — do not build on it.
- Variants resolve through theme vars (`bg-primary` = selected palette primary),
  so prefer `variant="default|outline|ghost|secondary"` over custom colors.

## 7. Interaction & a11y rules

- Touch targets ≥ 44px height on mobile (`min-height` in the ≤700px block).
- `useBlocker` + dialog (Save / Discard / Keep editing) for dirty forms; see weight page.
- Live regions (`aria-live="polite"`) for computed feedback; `fieldset`+`legend`
  for chip groups; `aria-pressed` on toggles; skip link + `#app-main` focus target.
- Animations: `app-enter` on main children; `dumbbell-float` on hero art only;
  honor `prefers-reduced-motion` (already global).

## 8. Agent checklist (every UI change)

1. Reuse classes from §5 before writing CSS; new CSS goes in `src/styles.css`
   using `var(--*)` tokens only, with a dark-mode value where color is involved.
2. Check ≤700px and ≥1600px breakpoints; touch targets; no horizontal overflow.
3. Keep `data-slot` attributes on shadcn parts (theme CSS hooks into them).
4. Run `pnpm exec biome check --write <files>` then `pnpm exec biome check <files>`;
   run `pnpm tsc --noEmit` and confirm zero **new** errors in touched files.
5. Never add hex colors, fonts, or border-radius values that contradict §1–§3.
