#!/usr/bin/env bash
# ============================================================
# apply.sh — run the Nepcali FC database migrations in order.
#
# Every migration is idempotent (CREATE ... IF NOT EXISTS /
# ALTER ... ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS),
# so this is safe to re-run any time.
#
# Usage:
#   export SUPABASE_DB_URL="postgresql://postgres:<password>@<host>:5432/postgres"
#   ./apply.sh            # apply schema + policies
#   ./apply.sh --seed     # also insert the sample roster / money rows
#
# Find SUPABASE_DB_URL in Supabase:
#   Project Settings > Database > Connection string > URI
#
# Requires the `psql` client (comes with PostgreSQL / `brew install libpq`).
# Prefer not to install psql? Just paste each file below, in this order,
# into the Supabase SQL Editor instead.
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "ERROR: set SUPABASE_DB_URL first (see the header of this script)." >&2
  exit 1
fi

# Table / schema migrations — order matters (later files depend on earlier ones).
CORE=(
  schema.sql                 # players, payments (base tables)
  schema-tournament.sql      # tournaments, matches, goals (internal Cup)
  schema-history.sql         # tournament_history
  schema-dashboard.sql       # club_settings (XI, events, socials)
  schema-usage.sql           # visit analytics
  schema-polls.sql           # polls, poll_responses (RSVP)
  schema-results.sql         # results (external match cards)
  schema-snaps.sql           # snaps table + public "snaps" storage bucket
  schema-player-photos.sql   # players.photo_url/photo_path/ratings (reuses snaps bucket)
  schema-expense-date.sql    # payments.txn_date
)

# Row Level Security policies — the CURRENT open-ish model.
POLICIES=(
  schema-public-read.sql        # public read for players/payments
  schema-roster-public-write.sql# anyone can edit the roster
  schema-money-editors.sql      # Money writes locked to allow-listed emails
  schema-access.sql             # tournament open; money/roster rules
)

SEEDS=(
  seed-roster.sql
  seed-money.sql
)

run() { echo "==> $1"; psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$1"; }

for f in "${CORE[@]}";     do run "$f"; done
for f in "${POLICIES[@]}"; do run "$f"; done

if [[ "${1:-}" == "--seed" ]]; then
  for f in "${SEEDS[@]}"; do run "$f"; done
fi

echo "✔ Migrations applied."
echo "NOTE: schema-rls-tighten.sql is OPT-IN and NOT run here (it disables public editing). See README.md."
