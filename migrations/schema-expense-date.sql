-- ============================================================
-- Add an optional transaction date to payments/expenses.
-- Run in Supabase: SQL Editor > New query > Run
-- ============================================================

alter table payments add column if not exists txn_date date;
