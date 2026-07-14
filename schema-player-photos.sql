-- ============================================================
-- PLAYER CARD — photo + rating card for each roster player
--
-- photo_url / photo_path : the image is uploaded to the existing
--   public "snaps" storage bucket (under a players/ prefix); the
--   public URL + storage path are stored on the player row.
-- ratings (jsonb)        : FIFA-style card values, e.g.
--   { "ovr":82, "pac":80, "sho":75, "pas":78, "dri":81, "def":40, "phy":70 }
--   Editable by admins in the app; shown to everyone.
--
-- Run in Supabase: SQL Editor > New query > Run  (idempotent, safe to re-run)
-- NOTE: run schema-snaps.sql at least once first — it creates the
--       public "snaps" bucket that the photo uploads reuse.
-- ============================================================

alter table players add column if not exists photo_url  text;
alter table players add column if not exists photo_path text;   -- storage path, for deletes/replaces
alter table players add column if not exists ratings    jsonb not null default '{}'::jsonb;
