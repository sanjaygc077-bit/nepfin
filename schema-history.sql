-- ============================================================
-- TOURNAMENT HISTORY — saved records of completed tournaments
-- Run in Supabase: SQL Editor > New query > Run
-- (Run AFTER schema.sql and schema-tournament.sql)
--
-- Each row is a snapshot taken when you press "Finish & save" on
-- the Cup > Table tab: final standings, champion, and top scorers
-- frozen at that moment. Deleting/regenerating the live tournament
-- does NOT affect these records.
-- ============================================================

create table if not exists tournament_history (
  id           uuid primary key default gen_random_uuid(),
  name         text,
  num_teams    int,
  champion     text,                          -- team name, or null
  runner_up    text,                          -- team name, or null
  standings    jsonb not null default '[]'::jsonb,  -- [{team,p,w,d,l,gf,ga,gd,pts}, ...]
  top_scorers  jsonb not null default '[]'::jsonb,  -- [{name,team,goals}, ...]
  team_names   jsonb not null default '{}'::jsonb,
  completed_at timestamptz default now()
);

-- Same access model as the live tournament tables: anyone can
-- read and write (no login needed).
alter table tournament_history enable row level security;

drop policy if exists "public all tournament_history" on tournament_history;
create policy "public all tournament_history"
  on tournament_history for all
  to anon, authenticated
  using (true) with check (true);
