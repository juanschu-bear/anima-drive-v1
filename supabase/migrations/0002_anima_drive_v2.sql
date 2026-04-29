-- 0002_anima_drive_v2.sql
--
-- Adds:
--   1. ad_documents.display_name        — AI-generated human-readable name
--      (e.g. "Mietvertrag Wohnung Berlin März 2026"). Falls back to filename.
--   2. ad_user_categories               — user-defined custom categories
--      so people can extend the built-in 17 with their own labels.
--   3. Adds 'contracts' to the built-in category enumeration (handled in
--      application code; the DB column is just text so no enum to update).
--
-- Idempotent — safe to run multiple times.

-- ─────────────────────────────────────────────────────────────────
-- 1. display_name on ad_documents
-- ─────────────────────────────────────────────────────────────────

alter table public.ad_documents
  add column if not exists display_name text;

comment on column public.ad_documents.display_name is
  'AI-generated readable title (e.g. "Mietvertrag März 2026"). Falls back to filename when null.';

-- ─────────────────────────────────────────────────────────────────
-- 2. ad_user_categories — custom user-defined categories
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.ad_user_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,                   -- e.g. "cat_my_subscriptions"
  label       text not null,                   -- display label e.g. "My Subscriptions"
  icon        text not null default 'folder',  -- icon name
  tint        text not null default 'mint',    -- accent tint key
  created_at  timestamptz not null default now(),

  unique (user_id, key)
);

alter table public.ad_user_categories enable row level security;

drop policy if exists "ad_user_categories user-read" on public.ad_user_categories;
create policy "ad_user_categories user-read" on public.ad_user_categories
  for select using (auth.uid() = user_id);

drop policy if exists "ad_user_categories user-write" on public.ad_user_categories;
create policy "ad_user_categories user-write" on public.ad_user_categories
  for insert with check (auth.uid() = user_id);

drop policy if exists "ad_user_categories user-update" on public.ad_user_categories;
create policy "ad_user_categories user-update" on public.ad_user_categories
  for update using (auth.uid() = user_id);

drop policy if exists "ad_user_categories user-delete" on public.ad_user_categories;
create policy "ad_user_categories user-delete" on public.ad_user_categories
  for delete using (auth.uid() = user_id);

create index if not exists ad_user_categories_user_idx
  on public.ad_user_categories (user_id);
