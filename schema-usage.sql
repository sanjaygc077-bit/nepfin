-- ============================================================
-- SITE USAGE — unique-visitor counter
-- Paste into Supabase: SQL Editor > New query > Run
--
-- Privacy: we never store a raw IP. The app sends only a salted
-- SHA-256 hash of the visitor's IP. The table is locked down (RLS
-- on, no direct policies) and is only reachable through the two
-- security-definer functions below, so the hashes can't be listed
-- by anonymous clients.
-- ============================================================

create table if not exists visitors (
  ip_hash     text primary key,
  visits      int  not null default 1,
  first_seen  timestamptz default now(),
  last_seen   timestamptz default now()
);

alter table visitors enable row level security;
-- (intentionally no policies: access only via the functions below)

-- Record a visit for a hashed IP and return that visitor's new count.
create or replace function log_visit(p_hash text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v int;
begin
  insert into visitors (ip_hash) values (p_hash)
  on conflict (ip_hash) do update
    set visits = visitors.visits + 1, last_seen = now()
  returning visits into v;
  return v;
end;
$$;

-- Aggregate stats: how many distinct visitors + total visits.
create or replace function visit_stats()
returns table(unique_visitors bigint, total_visits bigint)
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint, coalesce(sum(visits),0)::bigint from visitors;
$$;

grant execute on function log_visit(text) to anon, authenticated;
grant execute on function visit_stats()  to anon, authenticated;
