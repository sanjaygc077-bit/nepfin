-- ============================================================
-- TOURNAMENT tables — run this AFTER schema.sql
-- Paste into Supabase: SQL Editor > New query > Run
-- ============================================================

-- A tournament = one event with N teams. We keep a single
-- "active" tournament at a time for simplicity, but the table
-- supports many.
create table if not exists tournaments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'NEP Cali',
  num_teams   int  not null default 4,
  team_names  jsonb not null default '{}'::jsonb,  -- {"A":"Lions","B":"Tigers",...}
  created_at  timestamptz default now()
);

-- Each league + knockout match.
create table if not exists matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  match_no      int,                 -- ordering within the tournament
  stage         text default 'league',  -- 'league' | 'third' | 'final'
  home_team     text,                -- team id letter, e.g. "A"
  away_team     text,
  home_goals    int,                 -- null until played
  away_goals    int,
  created_at    timestamptz default now()
);

-- Goal scorers, linked to a match. Names are free text (independent
-- of the roster, per your choice).
create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid references matches(id) on delete cascade,
  team        text,                  -- which team the scorer is on
  scorer      text,                  -- player name (free text)
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security — same approach as the other tables:
-- any logged-in user can read & write.
-- ============================================================
alter table tournaments enable row level security;
alter table matches     enable row level security;
alter table goals       enable row level security;

create policy "logged in all tournaments" on tournaments for all to authenticated using (true) with check (true);
create policy "logged in all matches"     on matches     for all to authenticated using (true) with check (true);
create policy "logged in all goals"       on goals       for all to authenticated using (true) with check (true);
