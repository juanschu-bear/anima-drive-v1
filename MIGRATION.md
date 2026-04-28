# Migration to Vite + React Router

This document describes the migration of Anima-Drive from a Babel-in-browser
static site (`public/index.html` + JSX files loaded as text) to a production
Vite + React 19 + TypeScript + react-router-dom application.

## What changed

### Removed
- `public/index.html` — old in-browser Babel host page
- `public/midfi.jsx` — the 6 mid-fi screens as inline-rendered components
- `public/tokens.jsx` — design tokens, hooks, and icon set
- `public/i18n.js` — translation strings and mock data
- `public/lowfi.jsx` — low-fidelity wireframes
- `public/design-canvas.jsx` — canvas wrapper
- `public/tweaks-panel.jsx` — live-tweaking panel
- `public/Anima-Drive Wireframes.html` — standalone wireframe HTML

### Added
- `src/main.tsx` — entry point, wraps app in Theme + Lang + Router providers
- `src/App.tsx` — route table for all 6 screens
- `src/index.css` — Tailwind import, CSS variables for theming, all keyframes
- `src/types.ts` — shared TypeScript types
- `src/lib/theme.tsx` — ThemeProvider, accent helpers using CSS vars
- `src/lib/i18n.tsx` — TR translation dict + LangProvider, all strings copied 1:1
- `src/lib/mock-data.ts` — CATS and RECENT (with TODO markers for Supabase)
- `src/lib/utils.ts` — greetKey, useCountUp, useDelayed, numStyle
- `src/components/ui/` — 9 atom components (Icon, Panel, Chip, Orbs, Grain,
  StorageRing, KPI, TypingDots, ThumbSwatch)
- `src/components/` — 6 composed components (Sidebar, Categories, RecentCard,
  AIMsg, AIPanel, Activity, UploadModalOverlay)
- `src/pages/` — all 6 screens as pages (Dashboard, CategoryDetail, Browser,
  AIFull, UploadModal, Onboarding)
- `src/vite-env.d.ts` — Vite client types reference
- `VERIFICATION.md` — source ↔ output verification checklist

### Modified
- `index.html` — now a Vite host with Geist + Geist Mono Google Fonts preconnect
- `package.json` — added `react-router-dom` ^7.14.2
- `vercel.json` — switched from `cp public/* dist/` to `npm run build` with
  Vite framework preset and SPA rewrites for client-side routing

## Architecture

### Theming
Uses CSS variables on `<html data-theme="dark|light">`. Tailwind utilities
reach the variables via `bg-[var(--ad-...)]`, `text-[var(--ad-...)]` etc.
The accent palette is OKLCH so hue shifts stay lightness-stable across
themes. Theme switch is CSS-only — no React re-renders for the cascade.

For dynamic accent-tinted backgrounds where Tailwind can't reach (gradients,
shadows, color-mix), components reference the CSS var directly via
`var(--ad-accent-mint)` or the `ACCENT_VARS` map from `lib/theme.tsx`.

### i18n
`src/lib/i18n.tsx` exposes `useLang()` returning `{ lang, setLang, t }`.
All ~80 keys are typed via the `TranslationKey` union. Falls back to
English if a key is missing in the active language.

### Routing
`react-router-dom` v7 BrowserRouter. Routes:

| Path | Component |
|------|-----------|
| `/` | Dashboard |
| `/categories/:id` | CategoryDetail (id = "expenses", "salaries", etc.) |
| `/categories` | redirect → `/documents` |
| `/documents` | Browser |
| `/ai` | AIFull |
| `/upload` | UploadModal |
| `/onboarding` | Onboarding |
| `*` | redirect → `/` |

Sidebar nav items use `useNavigate()` and the active-state is inferred from
the current pathname.

### Mock data
`CATS` (16 categories) and `RECENT` (5 documents) are imported from
`src/lib/mock-data.ts`. Each constant has a `TODO:` comment marking where
the Supabase fetch should replace the static data.

## Production checklist

Before deploying, verify:

- [ ] `npm install` runs cleanly
- [ ] `npm run build` exits 0
- [ ] Vercel build env has Node 22+
- [ ] Google Fonts CDN reachable in production
- [ ] Tailwind 4 + `@tailwindcss/vite` plugin compatible with deployment
- [ ] OKLCH color values render correctly in target browsers
  (Chrome 111+, Safari 16.4+, Firefox 113+)

## Out of scope

Not addressed in this migration:

- Auth (Supabase Auth) — not wired
- Real Supabase data fetching — mocks remain with TODO markers
- AI receipt extraction
- Natural language queries to Jordan Cash
- Drive ↔ Sheets export
- Responsive mobile design (kept fixed at 1440×900 like the original)
- Real upload functionality (modal is visual-only with simulated progress)
- Real AI chat (panel is visual-only with scripted thread)

## Deviations from 1:1 fidelity (and why)

These are minor and intentional:

1. **`color-mix(in oklab, ...)` instead of hex+alpha suffix.**
   Original used `${theme.accent.mint}1f` (hex with alpha). With OKLCH
   accents this no longer works string-wise, so `color-mix()` is used.
   The visual result is equivalent or better (perceptually uniform).

2. **Icon `stroke` prop renamed internally.**
   `IconProps` extends `Omit<SVGProps, "stroke">` because the native SVG
   `stroke` attribute is typed as string while the prop is a number for
   strokeWidth. Maps to the `strokeWidth` SVG attribute.

3. **Three `as CSSProperties` casts.**
   In Grain, Orbs, and one helper, `opacity: "var(--ad-...)"` is a string
   value where React's CSSProperties types the field as number-only. The
   cast is documented inline in each file.

4. **Search placeholder in Dashboard header is hardcoded "Search".**
   Original was identical (no translation key for it).

5. **AI Panel last message "Expires 31 Dec 2026, 12-month notice." is
   hardcoded English.** Original was identical.
