-- ============================================================
-- NEP Cali full-stack schema
-- Paste this whole file into Supabase: SQL Editor > New query > Run
-- ============================================================

-- 1. PLAYERS (roster)
create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  position    text,                       -- GK, DEF, MID, FWD
  team        text,                        -- A, B, C, D...
  jersey_no   int,                         -- jersey number
  created_at  timestamptz default now()
);

-- 2. PAYMENTS (money tracking: fees, balances)
create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid references players(id) on delete cascade,
  amount      numeric(10,2) not null,      -- positive = paid, negative = owed/adjustment
  note        text,                        -- "registration fee", "jersey", etc.
  paid        boolean default false,       -- has this been settled?
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- This controls WHO can read/write. For a practice app we let
-- any logged-in user read & write. In a real product you'd
-- scope this per-user or per-team.
-- ============================================================
alter table players  enable row level security;
alter table payments enable row level security;

-- Allow logged-in users full access
create policy "logged in can do everything on players"
  on players for all
  to authenticated
  using (true) with check (true);

create policy "logged in can do everything on payments"
  on payments for all
  to authenticated
  using (true) with check (true);

-- Optional: a unique jersey number per team (uncomment to enforce)
-- create unique index uniq_jersey_per_team on players (team, jersey_no);
