# Database migrations

All the SQL that sets up the Supabase (Postgres) backend for Nepcali FC.
Every file is **idempotent** — safe to run more than once.

## How to apply

**Option A — one command (needs the `psql` client):**

```bash
cd migrations
export SUPABASE_DB_URL="postgresql://postgres:<password>@<host>:5432/postgres"
./apply.sh          # schema + policies
./apply.sh --seed   # also insert sample roster / money data
```

Get `SUPABASE_DB_URL` from **Supabase → Project Settings → Database → Connection string → URI**.

**Option B — copy/paste:** open each file below **in the order listed** and run it in
**Supabase → SQL Editor → New query**.

## Order

### 1. Tables (`CORE`)
| # | File | Creates |
|---|------|---------|
| 1 | `schema.sql` | `players`, `payments` |
| 2 | `schema-tournament.sql` | `tournaments`, `matches`, `goals` (internal Cup) |
| 3 | `schema-history.sql` | `tournament_history` |
| 4 | `schema-dashboard.sql` | `club_settings` (Starting XI, events, social links) |
| 5 | `schema-usage.sql` | visit analytics |
| 6 | `schema-polls.sql` | `polls`, `poll_responses` (RSVP) |
| 7 | `schema-results.sql` | `results` (external match cards) |
| 8 | `schema-snaps.sql` | `snaps` table + public `snaps` storage bucket |
| 9 | `schema-player-photos.sql` | `players.photo_url / photo_path / ratings` (reuses the `snaps` bucket) |
| 10 | `schema-expense-date.sql` | `payments.txn_date` |

### 2. Row Level Security policies (`POLICIES`) — current model
| File | Effect |
|------|--------|
| `schema-public-read.sql` | Public read for `players` / `payments` |
| `schema-roster-public-write.sql` | Anyone can add/edit roster players |
| `schema-money-editors.sql` | `payments` writes restricted to allow-listed emails |
| `schema-access.sql` | Tournament tables open; money/roster rules |

### 3. Seeds (optional)
`seed-roster.sql`, `seed-money.sql`

## Optional: tighten security

`schema-rls-tighten.sql` is **NOT** applied by `apply.sh`. It switches the
public content tables (roster, RSVP, snaps, results, tournament, dashboard,
history) to **public read + login required to write**, while leaving Money
locked to admins as before.

⚠️ Running it **disables the "anyone can edit without logging in"** behaviour
for the roster, RSVP and Snaps. Only apply it if you want editing to require an
account. To apply:

```bash
psql "$SUPABASE_DB_URL" -f schema-rls-tighten.sql
```
