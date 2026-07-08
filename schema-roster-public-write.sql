-- ============================================================
-- ROSTER: make it publicly editable (no login required)
-- Run in Supabase: SQL Editor > New query > Run
-- (Run AFTER schema.sql and schema-public-read.sql)
--
-- Opens the players (roster) table so ANYONE can add, edit, and
-- delete players — same public model as the Cup/tournament tables.
--
-- NOTE: this only affects players (roster). Money (payments) is
-- untouched and stays locked to allowlisted emails.
-- ============================================================

drop policy if exists "auth only players"     on players;
drop policy if exists "auth insert players"   on players;
drop policy if exists "auth update players"   on players;
drop policy if exists "auth delete players"   on players;
drop policy if exists "public insert players" on players;
drop policy if exists "public update players" on players;
drop policy if exists "public delete players" on players;

drop policy if exists "public read players" on players;
create policy "public read players"   on players for select to anon, authenticated using (true);
create policy "public insert players" on players for insert to anon, authenticated with check (true);
create policy "public update players" on players for update to anon, authenticated using (true) with check (true);
create policy "public delete players" on players for delete to anon, authenticated using (true);
