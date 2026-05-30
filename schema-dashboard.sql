-- ============================================================
-- DASHBOARD / CLUB SETTINGS — run this AFTER the other schema files
-- Paste into Supabase: SQL Editor > New query > Run
--
-- Holds the editable bits shown on the Dashboard + Starting XI:
--   * next tournament name + date
--   * upcoming events list
--   * the starting XI (formation + the 11 picks)
-- All stored as one JSON document in a single row (id = 1).
--
-- NOTE: the app works WITHOUT this table too — it falls back to
-- the browser's localStorage. Run this only if you want the data
-- shared live across every device (same as scores).
-- ============================================================

create table if not exists club_settings (
  id          int primary key default 1,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now(),
  constraint club_settings_single_row check (id = 1)
);

-- Public read + write, same as the tournament tables.
alter table club_settings enable row level security;

drop policy if exists "public all club_settings" on club_settings;
create policy "public all club_settings"
  on club_settings for all
  to anon, authenticated
  using (true) with check (true);

-- Make sure the single row exists.
insert into club_settings (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;
