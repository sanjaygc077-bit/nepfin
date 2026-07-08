-- ============================================================
-- MONEY ACCESS: restrict payment WRITES to specific member emails
-- Run in Supabase: SQL Editor > New query > Run
-- (Run AFTER schema.sql and schema-public-read.sql)
--
-- Model:
--   * payments : ANYONE can READ (so the public Dashboard totals work).
--   * Only the emails listed below can INSERT / UPDATE / DELETE.
--
-- To add/remove a member, edit BOTH:
--   1) this list (in the three policies below), then re-run this file, and
--   2) the MONEY_EDITORS array in index.html (for the UI gating).
--
-- Emails are compared lowercase. Keep them lowercase here.
-- ============================================================

-- Remove the old "any logged-in user can write" policies.
drop policy if exists "auth only payments"    on payments;
drop policy if exists "auth insert payments"  on payments;
drop policy if exists "auth update payments"  on payments;
drop policy if exists "auth delete payments"  on payments;
drop policy if exists "money editors insert payments" on payments;
drop policy if exists "money editors update payments" on payments;
drop policy if exists "money editors delete payments" on payments;

-- Keep public read so the Dashboard money totals still show for everyone.
drop policy if exists "public read payments" on payments;
create policy "public read payments" on payments
  for select to anon, authenticated using (true);

-- Only these member emails may add / edit / delete payments.
create policy "money editors insert payments" on payments
  for insert to authenticated
  with check ( lower(auth.jwt() ->> 'email') in (
    'sanjay.gc09@gmail.com'
  ) );

create policy "money editors update payments" on payments
  for update to authenticated
  using ( lower(auth.jwt() ->> 'email') in (
    'sanjay.gc09@gmail.com'
  ) )
  with check ( lower(auth.jwt() ->> 'email') in (
    'sanjay.gc09@gmail.com'
  ) );

create policy "money editors delete payments" on payments
  for delete to authenticated
  using ( lower(auth.jwt() ->> 'email') in (
    'sanjay.gc09@gmail.com'
  ) );
