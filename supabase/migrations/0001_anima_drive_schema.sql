-- Anima-Drive schema (V1)
-- All tables prefixed with `ad_` since they live alongside WhatsAnima tables.
-- Run this once in the Supabase SQL editor for project wofklmwbokdjoqlstjmy.

-- ─────────────────────────────────────────────────────────────────
-- Documents — one row per uploaded file.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.ad_documents (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  filename              text not null,
  ext                   text not null,
  size_bytes            bigint not null,
  storage_path          text not null,                 -- bucket path: <user_id>/<uuid>.<ext>
  mime_type             text,
  category_key          text,                          -- "cat_expenses", null until categorized
  category_confidence   numeric(4,3),                  -- 0.000 - 1.000
  status                text not null default 'uploaded',
                                                       -- uploaded | categorizing | extracting | ready | failed
  error_message         text,
  uploaded_at           timestamptz not null default now(),
  categorized_at        timestamptz,
  extracted_at          timestamptz
);

create index if not exists ad_documents_user_id_idx
  on public.ad_documents(user_id);

create index if not exists ad_documents_user_uploaded_idx
  on public.ad_documents(user_id, uploaded_at desc);

create index if not exists ad_documents_category_idx
  on public.ad_documents(user_id, category_key)
  where category_key is not null;

-- ─────────────────────────────────────────────────────────────────
-- Extractions — structured data extracted from each document.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.ad_extractions (
  id                uuid primary key default gen_random_uuid(),
  document_id       uuid not null references public.ad_documents(id) on delete cascade,
  vendor            text,
  doc_date          date,
  total_amount      numeric(12,2),
  currency          text default 'EUR',
  vat_amount        numeric(12,2),
  vat_rate          numeric(5,2),
  invoice_number    text,
  due_date          date,
  payment_terms     text,
  raw_extraction    jsonb,                            -- full LLM response for debugging
  created_at        timestamptz not null default now()
);

create unique index if not exists ad_extractions_document_id_uidx
  on public.ad_extractions(document_id);

-- ─────────────────────────────────────────────────────────────────
-- Line items — invoices may have many.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.ad_line_items (
  id              uuid primary key default gen_random_uuid(),
  extraction_id   uuid not null references public.ad_extractions(id) on delete cascade,
  description     text not null,
  quantity        numeric,
  unit_price      numeric(12,2),
  amount          numeric(12,2) not null,
  position        int not null
);

create index if not exists ad_line_items_extraction_id_idx
  on public.ad_line_items(extraction_id);

-- ─────────────────────────────────────────────────────────────────
-- Activities — feed shown on the dashboard.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.ad_activities (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  document_id     uuid references public.ad_documents(id) on delete set null,
  type            text not null,                       -- categorized | uploaded | exported | extracted | failed
  message         text not null,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists ad_activities_user_created_idx
  on public.ad_activities(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────
-- Conversations + messages — Ask Anima history.
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.ad_conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists ad_conversations_user_updated_idx
  on public.ad_conversations(user_id, updated_at desc);

create table if not exists public.ad_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ad_conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  document_refs   uuid[],                              -- referenced documents from retrieval
  created_at      timestamptz not null default now()
);

create index if not exists ad_messages_conv_created_idx
  on public.ad_messages(conversation_id, created_at asc);

-- ─────────────────────────────────────────────────────────────────
-- Row Level Security — every user sees only their own data.
-- ─────────────────────────────────────────────────────────────────

alter table public.ad_documents      enable row level security;
alter table public.ad_extractions    enable row level security;
alter table public.ad_line_items     enable row level security;
alter table public.ad_activities     enable row level security;
alter table public.ad_conversations  enable row level security;
alter table public.ad_messages       enable row level security;

-- Documents — direct user_id check
drop policy if exists "ad_documents user-owns" on public.ad_documents;
create policy "ad_documents user-owns" on public.ad_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Activities — direct user_id check
drop policy if exists "ad_activities user-owns" on public.ad_activities;
create policy "ad_activities user-owns" on public.ad_activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Conversations — direct user_id check
drop policy if exists "ad_conversations user-owns" on public.ad_conversations;
create policy "ad_conversations user-owns" on public.ad_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Extractions — through document
drop policy if exists "ad_extractions via-document" on public.ad_extractions;
create policy "ad_extractions via-document" on public.ad_extractions
  for all using (
    exists (
      select 1 from public.ad_documents d
      where d.id = ad_extractions.document_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ad_documents d
      where d.id = ad_extractions.document_id and d.user_id = auth.uid()
    )
  );

-- Line items — through extraction → document
drop policy if exists "ad_line_items via-extraction" on public.ad_line_items;
create policy "ad_line_items via-extraction" on public.ad_line_items
  for all using (
    exists (
      select 1 from public.ad_extractions e
      join public.ad_documents d on d.id = e.document_id
      where e.id = ad_line_items.extraction_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ad_extractions e
      join public.ad_documents d on d.id = e.document_id
      where e.id = ad_line_items.extraction_id and d.user_id = auth.uid()
    )
  );

-- Messages — through conversation
drop policy if exists "ad_messages via-conversation" on public.ad_messages;
create policy "ad_messages via-conversation" on public.ad_messages
  for all using (
    exists (
      select 1 from public.ad_conversations c
      where c.id = ad_messages.conversation_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ad_conversations c
      where c.id = ad_messages.conversation_id and c.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- Storage bucket — upload Supabase Studio side, but RLS goes here.
-- ─────────────────────────────────────────────────────────────────

-- After running this migration, manually create the bucket "ad-docs"
-- in the Supabase Dashboard → Storage with `public = false`.
-- Then run the policies below (they reference storage.objects which
-- is in the storage schema, so we need to be in the storage schema):

drop policy if exists "ad_docs user-read" on storage.objects;
create policy "ad_docs user-read" on storage.objects
  for select using (
    bucket_id = 'ad-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ad_docs user-write" on storage.objects;
create policy "ad_docs user-write" on storage.objects
  for insert with check (
    bucket_id = 'ad-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ad_docs user-update" on storage.objects;
create policy "ad_docs user-update" on storage.objects
  for update using (
    bucket_id = 'ad-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "ad_docs user-delete" on storage.objects;
create policy "ad_docs user-delete" on storage.objects
  for delete using (
    bucket_id = 'ad-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );
