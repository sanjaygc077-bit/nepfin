-- ============================================================
-- SEED MONEY — Nepcali Budget (from the team spreadsheet)
-- Run in Supabase: SQL Editor > New query > Run
-- (Run AFTER schema.sql. Safe to re-run: it clears its own
--  seeded rows first, so it won't create duplicates.)
--
-- Reconciliation:
--   Contributions: 28 players  = $1,415.00
--   Expenses                   = -$579.64
--   ------------------------------------------
--   Balance                    =  $835.36   ✓
-- ============================================================

-- 1) Make sure every contributor exists as a player (insert only
--    the names that aren't already in the roster, case-insensitive).
insert into players (name)
select v.name
from (values
  ('Saroj'),('Shyam'),('Manoj'),('Manish'),('Nabin'),('Toya'),
  ('Sailesh'),('Prithivi'),('Prem'),('Sanjaya'),('Bhimsen'),('Nabaraj'),
  ('Milan'),('Aavash'),('Aashish'),('Manoj a'),('Omkar'),('Bidur'),
  ('Susan'),('Kundan'),('Nabin shrestha'),('Dinesh'),('Dip'),('Krisham'),
  ('Ronish'),('Aayush'),('Pratyush'),('Nabin lam')
) as v(name)
where not exists (
  select 1 from players p where lower(p.name) = lower(v.name)
);

-- 2) Clear any previously-seeded budget rows so this script is idempotent.
delete from payments where note = 'Budget contribution';
delete from payments where note in (
  '01/30 expenses',
  '2/7/2026 match expenses',
  '04/5/2026 air pressure for ball',
  'fremont game'
);

-- 3) Player contributions (paid). Matched to players by name.
insert into payments (player_id, amount, paid, note)
select p.id, v.amount, true, 'Budget contribution'
from (values
  ('Saroj',50),('Shyam',50),('Manoj',50),('Manish',50),('Nabin',50),
  ('Toya',50),('Sailesh',50),('Prithivi',50),('Prem',50),('Sanjaya',50),
  ('Bhimsen',50),('Nabaraj',50),('Milan',50),('Aavash',55),('Aashish',50),
  ('Manoj a',50),('Omkar',50),('Bidur',50),('Susan',50),('Kundan',60),
  ('Nabin shrestha',50),('Dinesh',50),('Dip',50),('Krisham',50),('Ronish',50),
  ('Aayush',50),('Pratyush',50),('Nabin lam',50)
) as v(name, amount)
join players p on lower(p.name) = lower(v.name);

-- 4) Club expenses (paid, negative — not tied to a player).
insert into payments (player_id, amount, paid, note)
select null, v.amount, true, v.note
from (values
  (-437.53, '01/30 expenses'),
  (-54.11,  '2/7/2026 match expenses'),
  (-28.00,  '04/5/2026 air pressure for ball'),
  (-60.00,  'fremont game')
) as v(amount, note);

-- 5) (Optional sanity check) — should return 835.36
-- select sum(amount) as balance from payments
-- where note = 'Budget contribution' or note in
--   ('01/30 expenses','2/7/2026 match expenses','04/5/2026 air pressure for ball','fremont game');
