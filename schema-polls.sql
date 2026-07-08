-- ============================================================
-- POLLS / RSVP — attendance polls with guest (+1/+2) tracking
-- Run in Supabase: SQL Editor > New query > Run
-- (Run AFTER schema.sql)
--
-- Model:
--   * polls          : one row per question/event.
--   * poll_responses : one row per person's RSVP, incl. a guest count
--                      so "+1 / +2" people who aren't in the group are
--                      counted in one place.
--   * Fully public (anyone can create polls and RSVP) — same open model
--     as the Cup/tournament tables.
-- ============================================================

create table if not exists polls (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  when_text   text,                       -- free-text date/time/venue
  created_at  timestamptz default now()
);

create table if not exists poll_responses (
  id          uuid primary key default gen_random_uuid(),
  poll_id     uuid references polls(id) on delete cascade,
  name        text not null,
  status      text default 'going',       -- 'going' | 'maybe' | 'cant'
  guests      int  default 0,             -- how many extra people they bring (+1, +2…)
  guest_names text,                        -- optional names of the guests
  created_at  timestamptz default now()
);

create index if not exists poll_responses_poll_idx on poll_responses(poll_id);

alter table polls          enable row level security;
alter table poll_responses enable row level security;

drop policy if exists "public all polls" on polls;
create policy "public all polls" on polls
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "public all poll_responses" on poll_responses;
create policy "public all poll_responses" on poll_responses
  for all to anon, authenticated using (true) with check (true);
