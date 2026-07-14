-- ============================================================
-- SNAPS — club photos & videos gallery
-- Files upload to a public Supabase Storage bucket ("snaps");
-- one row per snap keeps the public URL + caption.
--
-- Run in Supabase: SQL Editor > New query > Run  (idempotent)
-- ============================================================

-- 1) Metadata table -----------------------------------------
create table if not exists snaps (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  path        text,                       -- storage path (for deletes); null for link-only snaps
  type        text default 'image',       -- 'image' | 'video'
  caption     text,
  created_at  timestamptz default now()
);

create index if not exists snaps_created_idx on snaps(created_at desc);

alter table snaps enable row level security;

drop policy if exists "public all snaps" on snaps;
create policy "public all snaps" on snaps
  for all to anon, authenticated using (true) with check (true);

-- 2) Public storage bucket for uploads ----------------------
insert into storage.buckets (id, name, public)
values ('snaps', 'snaps', true)
on conflict (id) do update set public = true;

-- 3) Storage access policies (open, matching the rest of the app)
drop policy if exists "snaps read"   on storage.objects;
create policy "snaps read"   on storage.objects
  for select to anon, authenticated using (bucket_id = 'snaps');

drop policy if exists "snaps insert" on storage.objects;
create policy "snaps insert" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'snaps');

drop policy if exists "snaps delete" on storage.objects;
create policy "snaps delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'snaps');
