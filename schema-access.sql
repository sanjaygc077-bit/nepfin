-- ============================================================
-- ACCESS RULES UPDATE
-- Run this in Supabase SQL Editor AFTER schema.sql and
-- schema-tournament.sql. It replaces the old "logged-in only"
-- rules with the new split:
--   * Tournament data (tournaments, matches, goals): ANYONE can
--     read AND write — no login needed.
--   * Money + roster (players, payments): LOGGED-IN only.
-- ============================================================

-- ---- TOURNAMENT TABLES: fully public (read + write) ----
-- The 'anon' role = visitors who are NOT logged in.
-- 'authenticated' = logged in. Granting to both = everyone.

drop policy if exists "logged in all tournaments" on tournaments;
drop policy if exists "logged in all matches"     on matches;
drop policy if exists "logged in all goals"       on goals;

create policy "public all tournaments" on tournaments for all to anon, authenticated using (true) with check (true);
create policy "public all matches"     on matches     for all to anon, authenticated using (true) with check (true);
create policy "public all goals"       on goals       for all to anon, authenticated using (true) with check (true);

-- ---- MONEY + ROSTER: logged-in only ----
-- These already have logged-in-only policies from schema.sql, but
-- we re-assert them here so this file is self-contained and safe
-- to run on its own.

drop policy if exists "logged in can do everything on players"  on players;
drop policy if exists "logged in can do everything on payments" on payments;

create policy "auth only players"  on players  for all to authenticated using (true) with check (true);
create policy "auth only payments" on payments for all to authenticated using (true) with check (true);

-- ============================================================
-- One more thing: anonymous visitors need an anon session to
-- read data. Supabase creates this automatically with the anon
-- key, so no extra step — but make sure "Enable anonymous sign-ins"
-- is NOT required here. The anon KEY already grants anon-role
-- access; you do NOT need to turn on anonymous auth.
-- ============================================================
