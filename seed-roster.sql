-- ============================================================
-- SEED ROSTER — the 22 official Nepcali FC players
-- Run in Supabase: SQL Editor > New query > Run
--
-- Safe to run more than once: it only inserts a name that isn't
-- already in the table (matched case-insensitively). Team and
-- position are left blank so you can assign them in the app's
-- editable Roster.
-- ============================================================

insert into players (name, jersey_no)
select v.name, v.jersey_no
from (values
  ('Krisham', 1),
  ('Sailesh', 2),
  ('Manoj', 3),
  ('Aavash', 4),
  ('Pratyush', 5),
  ('Nabin', 6),
  ('Prem', 7),
  ('Shyam', 8),
  ('Mahendra', 9),
  ('Jasbin', 10),
  ('Prithvi', 11),
  ('Aashish', 12),
  ('Mandip', 13),
  ('Susan', 14),
  ('Krishna', 15),
  ('Bhimsen', 16),
  ('Nabaraj', 17),
  ('Omkar', 18),
  ('Ranish', 19),
  ('Devendra', 20),
  ('Samrat', 21),
  ('Toya', 22)
) as v(name, jersey_no)
where not exists (
  select 1 from players p where lower(p.name) = lower(v.name)
);
