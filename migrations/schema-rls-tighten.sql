-- ============================================================
-- OPTIONAL — TIGHTEN ROW LEVEL SECURITY
--
-- Switches the public content tables to:
--     public READ  (anyone, no login)
--     WRITE only for logged-in (authenticated) users
--
-- Money (`payments`) is intentionally left untouched — it stays
-- locked to the allow-listed admin emails from schema-money-editors.sql.
-- Visitor analytics (`visitors`) is untouched — it is function-only.
--
-- ⚠️  RUNNING THIS DISABLES "anyone can edit without logging in" for the
--     roster, RSVP and Snaps. Only apply it if you want editing to
--     require an account.
--
-- This file is NOT run by apply.sh. Apply manually when you're ready:
--     psql "$SUPABASE_DB_URL" -f schema-rls-tighten.sql
-- Idempotent — safe to re-run.
-- ============================================================

-- Helper pattern per table: drop any prior open/all/write policies,
-- then recreate as public-read + authenticated-write.

-- ---- players (roster) ----
drop policy if exists "public read players"   on players;
drop policy if exists "public insert players" on players;
drop policy if exists "public update players" on players;
drop policy if exists "public delete players" on players;
drop policy if exists "auth only players"     on players;
create policy "read players"  on players for select to anon, authenticated using (true);
create policy "write players" on players for all    to authenticated       using (true) with check (true);

-- ---- club_settings (dashboard: XI, events, socials) ----
drop policy if exists "public all club_settings" on club_settings;
create policy "read club_settings"  on club_settings for select to anon, authenticated using (true);
create policy "write club_settings" on club_settings for all    to authenticated       using (true) with check (true);

-- ---- tournaments / matches / goals (internal Cup) ----
drop policy if exists "public all tournaments" on tournaments;
drop policy if exists "public all matches"     on matches;
drop policy if exists "public all goals"       on goals;
create policy "read tournaments"  on tournaments for select to anon, authenticated using (true);
create policy "write tournaments" on tournaments for all    to authenticated       using (true) with check (true);
create policy "read matches"      on matches     for select to anon, authenticated using (true);
create policy "write matches"     on matches     for all    to authenticated       using (true) with check (true);
create policy "read goals"        on goals       for select to anon, authenticated using (true);
create policy "write goals"       on goals       for all    to authenticated       using (true) with check (true);

-- ---- tournament_history ----
drop policy if exists "public all tournament_history" on tournament_history;
create policy "read tournament_history"  on tournament_history for select to anon, authenticated using (true);
create policy "write tournament_history" on tournament_history for all    to authenticated       using (true) with check (true);

-- ---- polls / poll_responses (RSVP) ----
drop policy if exists "public all polls"          on polls;
drop policy if exists "public all poll_responses" on poll_responses;
create policy "read polls"           on polls          for select to anon, authenticated using (true);
create policy "write polls"          on polls          for all    to authenticated       using (true) with check (true);
create policy "read poll_responses"  on poll_responses for select to anon, authenticated using (true);
create policy "write poll_responses" on poll_responses for all    to authenticated       using (true) with check (true);

-- ---- results (external match cards) ----
drop policy if exists "public all results" on results;
create policy "read results"  on results for select to anon, authenticated using (true);
create policy "write results" on results for all    to authenticated       using (true) with check (true);

-- ---- snaps (table + storage bucket) ----
drop policy if exists "public all snaps" on snaps;
create policy "read snaps"  on snaps for select to anon, authenticated using (true);
create policy "write snaps" on snaps for all    to authenticated       using (true) with check (true);

-- storage objects in the public "snaps" bucket (also holds player photos)
drop policy if exists "snaps read"   on storage.objects;
drop policy if exists "snaps insert" on storage.objects;
drop policy if exists "snaps delete" on storage.objects;
create policy "snaps read"   on storage.objects for select to anon, authenticated using (bucket_id = 'snaps');
create policy "snaps insert" on storage.objects for insert to authenticated       with check (bucket_id = 'snaps');
create policy "snaps delete" on storage.objects for delete to authenticated       using (bucket_id = 'snaps');
