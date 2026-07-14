-- ============================================================
-- RESULTS / HISTORY — saved matchday cards
-- A full broadcast card (teams, score, status + events) is saved
-- from the Matchday Live editor OR the Cup → Live tab, and shown
-- as-is in the home "Results" / history section.
--
-- The whole normalized card is stored in `data` (jsonb) so history
-- renders identically to the live card.
--
-- NOTE: separate from the Cup's `matches` table (internal tournament).
-- Run in Supabase: SQL Editor > New query > Run  (idempotent, safe to re-run)
-- ============================================================

create table if not exists results (
  id          uuid primary key default gen_random_uuid(),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz default now()
);

-- If an older version of this table exists, make sure the column is there.
alter table results add column if not exists data jsonb not null default '{}'::jsonb;

create index if not exists results_created_idx on results(created_at desc);

alter table results enable row level security;

drop policy if exists "public all results" on results;
create policy "public all results"
  on results for all
  to anon, authenticated using (true) with check (true);
