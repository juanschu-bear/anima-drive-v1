-- Central API keys for ecosystem service-to-service access.

create table if not exists public.ad_api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text,
  key_prefix    text not null,
  key_hash      text not null unique,
  scopes        text[] not null default '{}'::text[],
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

create index if not exists ad_api_keys_user_created_idx
  on public.ad_api_keys (user_id, created_at desc);

create table if not exists public.ad_api_key_events (
  id            bigint generated always as identity primary key,
  api_key_id    uuid not null references public.ad_api_keys(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  event_type    text not null,
  ip            text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists ad_api_key_events_key_created_idx
  on public.ad_api_key_events (api_key_id, created_at desc);

alter table public.ad_api_keys enable row level security;
alter table public.ad_api_key_events enable row level security;

drop policy if exists "ad_api_keys user-owns" on public.ad_api_keys;
create policy "ad_api_keys user-owns" on public.ad_api_keys
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ad_api_key_events user-owns" on public.ad_api_key_events;
create policy "ad_api_key_events user-owns" on public.ad_api_key_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
