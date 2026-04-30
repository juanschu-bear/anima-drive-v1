-- 0004_cfo_profile_engine.sql
--
-- MVP schema for CFO profile intelligence:
-- - ad_cfo_events: normalized event stream
-- - ad_cfo_profiles: latest computed profile snapshot per user
-- - ad_cfo_signals: active/resolved risk and behavior signals
-- - ad_cfo_recommendations: actionable CFO recommendations
--
-- Idempotent and safe to run multiple times.

create table if not exists public.ad_cfo_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  event_type      text not null,
  source          text not null,
  document_id     uuid references public.ad_documents(id) on delete set null,
  conversation_id uuid references public.ad_conversations(id) on delete set null,
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists ad_cfo_events_user_created_idx
  on public.ad_cfo_events(user_id, created_at desc);

create index if not exists ad_cfo_events_type_idx
  on public.ad_cfo_events(user_id, event_type, created_at desc);

create table if not exists public.ad_cfo_profiles (
  user_id                  uuid primary key references auth.users(id) on delete cascade,
  health_score             numeric(5,2) not null default 50,
  risk_level               text not null default 'medium',
  total_spend_30d          numeric(12,2) not null default 0,
  total_spend_prev_30d     numeric(12,2) not null default 0,
  active_financial_docs    int not null default 0,
  active_contract_docs     int not null default 0,
  open_due_14d_count       int not null default 0,
  open_due_14d_amount      numeric(12,2) not null default 0,
  top_vendor               text,
  top_vendor_share         numeric(6,4),
  behavior_stress_score    numeric(5,2) not null default 0,
  profile_json             jsonb not null default '{}'::jsonb,
  last_recomputed_at       timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table if not exists public.ad_cfo_signals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  signal_key      text not null,
  severity        text not null check (severity in ('low', 'medium', 'high', 'critical')),
  score           numeric(5,2) not null default 0,
  title           text not null,
  details         text not null,
  payload         jsonb not null default '{}'::jsonb,
  status          text not null default 'active' check (status in ('active', 'resolved')),
  detected_at     timestamptz not null default now(),
  resolved_at     timestamptz
);

create index if not exists ad_cfo_signals_user_status_idx
  on public.ad_cfo_signals(user_id, status, detected_at desc);

create table if not exists public.ad_cfo_recommendations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  signal_id       uuid references public.ad_cfo_signals(id) on delete set null,
  priority        int not null default 3,
  title           text not null,
  rationale       text not null,
  action          text not null,
  status          text not null default 'pending' check (status in ('pending', 'done', 'dismissed')),
  due_date        date,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists ad_cfo_recommendations_user_status_idx
  on public.ad_cfo_recommendations(user_id, status, created_at desc);

alter table public.ad_cfo_events enable row level security;
alter table public.ad_cfo_profiles enable row level security;
alter table public.ad_cfo_signals enable row level security;
alter table public.ad_cfo_recommendations enable row level security;

drop policy if exists "ad_cfo_events user-owns" on public.ad_cfo_events;
create policy "ad_cfo_events user-owns" on public.ad_cfo_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ad_cfo_profiles user-owns" on public.ad_cfo_profiles;
create policy "ad_cfo_profiles user-owns" on public.ad_cfo_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ad_cfo_signals user-owns" on public.ad_cfo_signals;
create policy "ad_cfo_signals user-owns" on public.ad_cfo_signals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ad_cfo_recommendations user-owns" on public.ad_cfo_recommendations;
create policy "ad_cfo_recommendations user-owns" on public.ad_cfo_recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

