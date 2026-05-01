# Anima-Drive — Production Setup Guide

This guide walks through wiring Anima-Drive to a real backend after the migration.

By default the app runs in **demo mode** — Supabase env vars are missing, mock data shows on every screen, and AI calls are stubbed. To enable the real document brain, follow the steps below in order.

---

## 1. Run the Supabase migration

The `wofklmwbokdjoqlstjmy` project is shared with WhatsAnima, so all Anima-Drive tables are prefixed `ad_`.

1. Open the Supabase dashboard for project `wofklmwbokdjoqlstjmy`.
2. Go to **SQL Editor** → **New query**.
3. Paste the contents of `supabase/migrations/0001_anima_drive_schema.sql`.
4. Run it.
5. Verify in **Table Editor** that you see six new tables: `ad_documents`, `ad_extractions`, `ad_line_items`, `ad_activities`, `ad_conversations`, `ad_messages`.

The migration also creates Storage policies for the `ad-docs` bucket. The bucket itself must be created manually:

6. Go to **Storage** → **New bucket**.
7. Name: `ad-docs`. Public: **off**. File size limit: 25 MB.
8. Create.

The four storage policies (`ad_docs user-read/write/update/delete`) were added by the migration; verify them under **Storage → Policies**.

## 2. Enable Email/Password Auth

1. In Supabase: **Authentication** → **Providers** → **Email**.
2. Make sure **Enable email provider** is on.
3. Decide whether to require email confirmation. For dev you can disable it (faster signup), for production leave it on.

## 3. Set environment variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables**. Add the following:

| Name | Value | Where to find |
|------|-------|---------------|
| `SUPABASE_URL` | `https://wofklmwbokdjoqlstjmy.supabase.co` | Supabase → Project Settings → API |
| `SUPABASE_ANON_KEY` | the anon public key | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | the service_role secret | Supabase → Project Settings → API → "service_role" |
| `OLLAMA_URL` | `http://77.48.24.250:48439/v1/chat/completions` | (your existing Ollama proxy) |
| `OLLAMA_MODEL` | `qwen3.5:35b` | (or whichever model you serve) |
| `OLLAMA_TIMEOUT_MS` | `45000` | optional, default 45000 |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | https://console.anthropic.com → API Keys |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5-20251001` | optional, default claude-haiku-4-5 |

> Canonical env names are non-prefixed (`SUPABASE_*`). `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are still accepted as fallback aliases for compatibility.

After saving, redeploy: **Deployments** → latest → **Redeploy**.

## 4. Verify the API routes

After deployment, three Vercel functions should be active:

- `POST /api/categorize` → assigns a category to an uploaded document
- `POST /api/extract` → extracts vendor/amount/line items
- `POST /api/ask` → answers natural language questions
- `GET/POST/DELETE /api/api-keys` → centralized ecosystem API keys (scoped, revokable)

Test endpoint reachability:

```bash
curl -i -X POST https://your-domain.vercel.app/api/categorize \
  -H "Content-Type: application/json" \
  -d '{"documentId":"00000000-0000-0000-0000-000000000000"}'
```

Expected: `401 Unauthorized` (because no bearer token). That's correct — it means the route is live.

## 5. Test the full loop

1. Visit the app, sign up with email + password.
2. Upload a real receipt (PDF or JPG).
3. Watch the upload modal go: `uploading → categorizing → ready`.
4. Open the dashboard — the doc should appear in Recent Uploads with a category chip.
5. Open the doc detail modal — extracted data should be visible.
6. Open Ask Anima, type a question like *"what's my latest invoice?"* — answer should reference the doc by name.

## Troubleshooting

### "supabaseUrl is required" on page load
The `SUPABASE_URL` (or `VITE_SUPABASE_URL`) env var isn't reaching the build. Re-check Vercel env vars (must be set for **Production**, not just Preview), then redeploy.

### Categorize returns 502 with "Ollama failed"
Check that `77.48.24.250:48439` is reachable from Vercel's region. Vercel functions run in `iad1` (US East) by default — set the region in `vercel.json` if you need EU egress. The Anthropic Haiku fallback should kick in automatically when Ollama is down; verify `ANTHROPIC_API_KEY` is set.

### Upload succeeds but document stays in "categorizing"
The `/api/categorize` request is firing but failing silently. Check the function logs in Vercel under **Deployments** → click deployment → **Functions** tab. Common causes:
- Missing `SUPABASE_SERVICE_ROLE_KEY` (categorize uses it to update doc status)
- LLM returning malformed JSON

### "Unauthorized" on every API call
The browser isn't sending an Authorization header. Make sure you're signed in (the bearer token comes from the Supabase session).

### Storage upload fails with 403
Verify the `ad_docs user-write` storage policy exists in Supabase → Storage → Policies. Re-run the migration if it doesn't.

## What's next

Wired:
- ✅ Auth (email/password)
- ✅ Real document upload to Storage
- ✅ AI categorization (Ollama → Anthropic fallback)
- ✅ AI receipt extraction
- ✅ Ask Anima with grounded retrieval

Not yet:
- ⬜ Anima Sheets export endpoint
- ⬜ Bank statement ingestion
- ⬜ Tax-prep assistant
- ⬜ Multi-tenant / team workspaces
- ⬜ Vector search (currently we send the doc list inline; works up to ~30 docs, breaks down at ~100)
- ⬜ Conversation history UI (data is persisted, but no UI to browse past threads yet)
