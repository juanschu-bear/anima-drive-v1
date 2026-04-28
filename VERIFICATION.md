# Anima-Drive Migration — Verification Checklist

## Source ↔ Output Comparison (against `/tmp/midfi.jsx` + `/tmp/tokens.jsx` + `/tmp/i18n.js`)

### Tokens & Theme
- [x] TOKENS.dark — all 13 properties → CSS vars `--ad-*` in `[data-theme="dark"]`
- [x] TOKENS.light — all 13 properties → CSS vars `--ad-*` in `[data-theme="light"]`
- [x] Accent palette (mint/coral/amber/blue) → OKLCH vars (theme-aware lightness)
- [x] All 9 keyframes (fadeUp, chipPulse, dotPulse, zonePulse, growUp, logoSpin, logoCounterSpin, orbDrift0/1/2)
- [x] greetKey() — same 12/18 hour split
- [x] useCountUp(target, ms, key) — cubic ease-out, RAF-driven
- [x] useDelayed(ms) — boolean toggle after ms
- [x] numStyle — fontVariantNumeric: tabular-nums

### i18n
- [x] All 80+ TR keys × 3 languages (en/de/es) — copied verbatim
- [x] LangProvider with t(key) fallback to English
- [x] CATS array — 16 entries, identical order/icons/tints/counts
- [x] RECENT array — 5 entries identical

### UI Atoms (`src/components/ui/`)
- [x] Icon — all 37 icon paths from tokens.jsx, multi-subpath split on " M"
- [x] Panel — frosted glass with --ad-panel-shadow
- [x] Chip — accent label with optional icon
- [x] Orbs — 3 drifting radial orbs, theme-aware opacity
- [x] Grain — feTurbulence SVG overlay, theme-aware opacity
- [x] StorageRing — animated SVG ring with strokeDashoffset transition
- [x] KPI — count-up animated, optional ring, blur radial accent
- [x] TypingDots — 3 staggered pulsing dots
- [x] ThumbSwatch — gradient bg with diagonal stripes + extension badge

### Composed Components
- [x] Sidebar — brand logo with conic-spin + counter-spin, 7 nav items, active glow bar, theme/lang toggles in footer
- [x] Categories — 3 treatments (grid/list/cloud) with hover transforms
- [x] RecentCard — 220px thumbnail card with chip and age
- [x] AIMsg — slide-in bubble with mine/theirs corner flip
- [x] AIPanel — header, scripted thread, suggestion chips, focus-glow input
- [x] Activity — timeline with tinted icons
- [x] UploadModalOverlay — pulsing drop zone, in-flight progress bars, format pills

### Pages (Routes)
- [x] Dashboard `/` — header, KPIs, Categories panel with treatment toggle, Recent + Activity row, AI panel right
- [x] CategoryDetail `/categories/:id` — breadcrumb, title with tinted icon, chart with growUp bars, docs list
- [x] Browser `/documents` — search + view toggle, filter pills, grid/list views
- [x] AIFull `/ai` — full-screen AI panel at width 720
- [x] UploadModal `/upload` — modal over orbs+grain backdrop
- [x] Onboarding `/onboarding` — large spinning logo, headline, drop zone, format pills

### Routing
- [x] react-router-dom v7 BrowserRouter
- [x] Sidebar NavLink → useNavigate on click
- [x] /categories/:id maps id to cat_${id}
- [x] /categories without id redirects to /documents
- [x] Unknown routes redirect to /

### Build
- [x] TypeScript Strict — no `any`, no `@ts-ignore` (3 documented `as CSSProperties` casts for CSS-var opacity)
- [x] tsc -b passes (0 errors)
- [x] vite build succeeds (67 modules, 284 KB gzip 86 KB)
- [x] CSS imported via main.tsx, vite-env.d.ts adds vite/client types

### Visual Verification (screenshots in /home/claude/screenshots/)
- [x] dashboard-dark — all sections render, AI panel right, sidebar active=dashboard
- [x] dashboard-light — beige bg, OKLCH tints darker as expected
- [x] dashboard-dark-de — full DE translation, locale-aware date "Montag, 27. Apr."
- [x] dashboard-dark-es — full ES translation, locale-aware date "lunes, 27 abr"
- [x] category-detail-dark — chart bars present (post-fix), docs list complete
- [x] category-detail-light — same
- [x] browser-dark — filter pills, 5×3 grid with tinted thumbs
- [x] browser-light — same
- [x] ai-full-dark — full-screen at 720px, 4 messages with typing dots
- [x] ai-full-light — same
- [x] upload-dark — modal centered over orbs, drop zone pulsing, 2 in-flight files
- [x] upload-light — same
- [x] onboarding-dark — spinning conic logo with multi-color glow
- [x] onboarding-light — same with lighter palette

### Known minor differences (1:1 with original by design)
- "Search" placeholder in Dashboard header is hardcoded English (original was identical)
- AI Panel last message "Expires 31 Dec 2026, 12-month notice." is hardcoded English (original was identical)

### Dependencies
- React 19, react-dom 19, react-router-dom 7.14.2
- @supabase/supabase-js 2.49.1 (kept for future wiring, currently unused)
- Tailwind CSS 4 + @tailwindcss/vite plugin
- Vite 6 + @vitejs/plugin-react

### External dependencies
- Google Fonts: Geist (400/500/600/700/800), Geist Mono (400/600/700/800)
- Loaded via `<link>` in index.html with preconnect to fonts.gstatic.com

### Out of scope (per agreed plan)
- Auth (Supabase Auth) — not wired
- Real Supabase data — CATS and RECENT are mocks with TODO markers
- AI receipt extraction — not implemented
- NLQ to Jordan Cash — not implemented
- Drive ↔ Sheets export — not implemented
- Responsive mobile — fixed 1440×900 like original
- Real upload functionality — modal is visual-only with simulated progress
- Real AI chat — panel is visual-only with scripted thread
