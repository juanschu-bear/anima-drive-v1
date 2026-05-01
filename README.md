<div align="center">
  <img src="public/logo.svg" alt="Anima-Drive" width="120" height="120" />

  # Anima-Drive

  **Documents, categorized.**
  An AI-native document brain for finance — replaces Google Drive with one that actually understands what you're filing.

  [![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## What this actually is

A drive built for the kind of work that happens *after* the receipt is taken — when a tax season is closing, when a board pack is due, when someone needs to know what was paid to whom in March.

Drop a document. Anima reads it, files it, remembers it, and answers questions about it later. No folders. No tags. No ZIP files of "to_sort/".

Most "AI document apps" you've seen are search bars bolted onto Dropbox. Anima-Drive is what happens when the AI is the filing system, not a feature on top of one.

## What it does

### The drop

Drag a folder of 200 receipts onto the screen. They get categorized into 16 financial buckets while you watch — Revenue, Expenses, Salaries, Rent, Insurance, Taxes, Depreciation, Travel, Office, Marketing, Software & licenses, Consulting, Vehicle costs, Telecoms, Entertainment, Other. The AI doesn't guess — it reads vendor, amount, date, line items, and assigns confidence per field.

### The conversations

`Ask Anima` is wired into every screen. Type *"all invoices over €500 from March"* and you get them, with attached document chips you can click. Type *"find my rental contract"* and you get the file plus a one-line summary of when it expires. Type *"how much did I spend on software last quarter"* — same thing, with totals.

This isn't keyword search. It's grounded retrieval over the structured data extracted from your documents.

### The avatar layer

Documents don't just sit on disk. They become context for **Jordan Cash**, the AI financial coach that lives in [ANIMA Connect](https://github.com/juanschu-bear/anima-connect). When Jordan opens a coaching session, every receipt, contract, and invoice you've uploaded is part of the conversation. Ask him during a call: *"how did Q3 actually go?"* — he answers from your real numbers.

### The export

Categorized data flows into Anima Sheets in the shape your accountant actually wants. Date, vendor, amount, VAT, category, source document link. No retyping. No reconciling.

## How it looks

| | Dark | Light |
|---|---|---|
| **Dashboard** | Glass-morphic dashboard with KPI count-up animations, drifting orb backgrounds, and a CFO-style category grid | Same with warm beige background, OKLCH-shifted accents that stay readable |
| **Category drill-down** | 12-month bar chart with growUp animation, document table with vendor, date, amount per row | |
| **Document browser** | 5-column grid view or 6-column list view, filter pills colored by category tint, ⌘K search | |
| **Onboarding** | Spinning conic-gradient logo, multi-color glow halo, pulsing drop zone | |

Every surface uses frosted glass over drifting radial orbs. Theme switch is CSS-variable native — no React re-render. Languages switch live, dates localize automatically (`Montag, 27. Apr.` ↔ `lunes, 27 abr` ↔ `Monday, Apr 27`).

## The stack

| Layer | What |
|---|---|
| **Build** | Vite 6 with `@tailwindcss/vite` plugin |
| **Framework** | React 19 with `react-router-dom` v7 |
| **Language** | TypeScript strict — no `any`, no `@ts-ignore` |
| **Styling** | Tailwind 4 + CSS variables on `[data-theme]`, OKLCH accent palette |
| **Backend** | Supabase (Postgres + Storage + Edge Functions) |
| **AI** | Claude Haiku (fast categorization) + Claude Opus (extraction, NLQ) |
| **Fonts** | Geist + Geist Mono via Google Fonts |
| **Deploy** | Vercel |

The accent palette is OKLCH so colors hue-shift correctly between dark and light without going muddy. The frosted-glass panels use real `backdrop-filter`, not a flat tinted background. The drifting orbs use `radial-gradient` with three independent drift animations seeded per page.

## Architecture

```
src/
├── main.tsx              # Entry — Theme + Lang + Router providers
├── App.tsx               # Routes (Dashboard, CategoryDetail, Browser, AIFull, UploadModal, Onboarding)
├── index.css             # CSS variables for theming, all 9 keyframes, Tailwind import
├── lib/
│   ├── theme.tsx         # ThemeProvider — sets [data-theme] on <html>
│   ├── i18n.tsx          # Full EN/DE/ES dict with type-safe keys
│   ├── mock-data.ts      # CATS + RECENT, marked TODO for Supabase fetch
│   └── utils.ts          # greetKey, useCountUp, useDelayed, numStyle
├── components/
│   ├── ui/               # Atoms — Icon (37 paths), Panel, Chip, Orbs, Grain, KPI, StorageRing, TypingDots, ThumbSwatch
│   ├── Sidebar.tsx       # Spinning conic-gradient brand + nav + theme/lang toggles
│   ├── AIPanel.tsx       # Right-rail AI assistant with scripted thread
│   ├── Activity.tsx      # Tinted timeline feed
│   ├── Categories.tsx    # 3 treatments (grid/list/cloud) of the same data
│   ├── RecentCard.tsx    # Recent-uploads card with thumbnail
│   ├── AIMsg.tsx         # Single chat bubble, slides in from its side
│   └── UploadModalOverlay.tsx
└── pages/                # The 6 screens
```

## Routes

| Path | Screen |
|---|---|
| `/` | Dashboard |
| `/categories/:id` | Category drill-down (`expenses`, `rent`, `salaries`...) |
| `/documents` | Document browser |
| `/ai` | Full-screen Ask Anima |
| `/upload` | Upload modal (preview) |
| `/onboarding` | Empty welcome state |

## Getting started

### Prerequisites

- Node 22+
- A Supabase project (only needed when wiring real data)

### Install and run

```bash
git clone https://github.com/juanschu-bear/anima-drive.git
cd anima-drive
npm install
npm run dev
```

Visit `http://localhost:5173`. The mock data ships pre-loaded so you can click through every screen without a backend.

### Build

```bash
npm run build
npm run preview
```

### Environment

When wiring real data, copy `.env.example` to `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Alias compatibility is enabled for `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## Roadmap

### Shipped

- [x] Six fully-styled screens with 1:1 mid-fi visual parity
- [x] EN / DE / ES translations with locale-aware date formatting
- [x] Dark and light themes via CSS variables, no re-renders
- [x] Three category visualization treatments (grid / list / cloud)
- [x] Mock data with explicit TODO markers for Supabase migration
- [x] Central API key API (`/api/api-keys`) with scoped, revokable keys for cross-app integrations

### Next

- [ ] Supabase Auth — sign in, magic links, session persistence
- [ ] Real document upload — Supabase Storage + chunked upload
- [ ] AI categorization — Claude Haiku per upload, confidence scoring
- [ ] Receipt extraction — Claude Opus with structured output (vendor, line items, VAT)
- [ ] Natural language queries — grounded retrieval over extracted data
- [ ] Anima Sheets export — direct push to the structured ledger
- [ ] Jordan Cash integration — documents as live coaching context

### Eventually

- [ ] Tax-prep assistant — generate filing-ready reports from uploaded receipts
- [ ] Bank statement ingestion — parse CSV/PDF, auto-categorize, match against existing receipts
- [ ] Multi-tenant — team workspaces with role-based access
- [ ] Audit trail — every read, write, and AI inference logged
- [ ] Mobile capture — native camera + on-device categorization

## Files of interest

- [`MIGRATION.md`](MIGRATION.md) — architecture notes and the migration from Babel-in-browser to Vite
- [`VERIFICATION.md`](VERIFICATION.md) — source-to-output checklist used during the migration
- [`src/lib/i18n.tsx`](src/lib/i18n.tsx) — every user-facing string in three languages
- [`src/index.css`](src/index.css) — the entire theming and animation layer

## License

© 2026 ONIOKO / EXIDEUS LLC. All rights reserved.

Anima-Drive is part of the ONIOKO platform alongside [WhatsAnima](https://github.com/juanschu-bear/whatsanima), [ANIMA Connect](https://github.com/juanschu-bear/anima-connect), and the OPM (Observational Perception Model) pipeline.
