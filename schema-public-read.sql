-- ============================================================
-- PUBLIC READ for Roster + Dashboard
-- Run this in Supabase: SQL Editor > New query > Run
-- (Run it AFTER schema.sql, schema-tournament.sql, schema-access.sql)
--
-- New access model:
--   * players  : ANYONE can READ. Only LOGGED-IN users can add/edit/delete.
--   * payments : ANYONE can READ (so the Dashboard money totals show).
--                Only LOGGED-IN users can add/edit/delete.
--   * The "Money" transactions tab is hidden behind login in the app UI,
--     but note: because payments are publicly READABLE here, the amounts
--     are technically visible to anyone who queries the API. That matches
--     your choice to show money totals on the public Dashboard.
-- ============================================================

-- ---------- PLAYERS ----------
drop policy if exists "auth only players"                      on players;
drop policy if exists "logged in can do everything on players" on players;
drop policy if exists "public read players"                    on players;
drop policy if exists "auth insert players"                    on players;
drop policy if exists "auth update players"                    on players;
drop policy if exists "auth delete players"                    on players;

create policy "public read players" on players for select to anon, authenticated using (true);
create policy "auth insert players" on players for insert to authenticated with check (true);
create policy "auth update players" on players for update to authenticated using (true) with check (true);
create policy "auth delete players" on players for delete to authenticated using (true);

-- ---------- PAYMENTS ----------
drop policy if exists "auth only payments"                      on payments;
drop policy if exists "logged in can do everything on payments" on payments;
drop policy if exists "public read payments"                    on payments;
drop policy if exists "auth insert payments"                    on payments;
drop policy if exists "auth update payments"                    on payments;
drop policy if exists "auth delete payments"                    on payments;

create policy "public read payments" on payments for select to anon, authenticated using (true);
create policy "auth insert payments" on payments for insert to authenticated with check (true);
create policy "auth update payments" on payments for update to authenticated using (true) with check (true);
create policy "auth delete payments" on payments for delete to authenticated using (true);
