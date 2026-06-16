# NEP Cali Manager

A lightweight, single-page web app for running a football (soccer) club — Nepcali FC. It tracks tournaments, live scores and standings, the starting XI, the player roster, and club money, all backed by [Supabase](https://supabase.com).

The entire frontend is a single `index.html` (vanilla HTML/CSS/JS, no build step). Data is stored in Supabase Postgres with Row Level Security controlling who can read and write.

## Features

| Tab | What it does | Access |
|-----|--------------|--------|
| Cup | League + knockout fixtures, score entry, goal scorers, saved history of completed tournaments | Public read/write |
| Dash | Club dashboard: upcoming tournament/events, money totals | Public read |
| XI | Starting XI builder (formation + 11 picks) | Public read |
| Roster | Player list with inline editing | Public read, login to edit |
| Money | Fees, balances, and payment tracking | Login only |

Other bits:
- Public welcome/landing page with club banner
- Unique-visitor counter (privacy-preserving: stores only a salted SHA-256 hash of the IP, never the raw IP)

## Tech stack

- Frontend: single `index.html` — plain HTML, CSS, and JavaScript (no framework, no bundler)
- Backend: Supabase (Postgres + Auth + Row Level Security)
- Config: `config.js` holds the Supabase project URL and anon public key

## Project structure

```
nepfin/
├── index.html              # The entire app (UI + logic)
├── config.js               # Supabase URL + anon key
├── club-banner.png         # Landing page banner
├── schema.sql              # Players + payments tables, base RLS
├── schema-tournament.sql   # Tournaments, matches, goals tables
├── schema-history.sql      # Saved records of completed tournaments
├── schema-dashboard.sql    # Club settings (dashboard, events, starting XI)
├── schema-usage.sql        # Unique-visitor counter (functions + table)
├── schema-access.sql       # Access split: public cup data, login-only money
├── schema-public-read.sql  # Public read for roster + payment totals
├── seed-roster.sql         # Seeds the 22 roster players
└── seed-money.sql          # Sample money/payment data
```

## Setup

### 1. Create a Supabase project
Sign in at [supabase.com](https://supabase.com) and create a new project.

### 2. Run the SQL schema files
In the Supabase dashboard, open **SQL Editor > New query** and run these files **in order**:

1. `schema.sql`
2. `schema-tournament.sql`
3. `schema-access.sql`
4. `schema-public-read.sql`
5. `schema-dashboard.sql`
6. `schema-usage.sql`
7. `schema-history.sql`

Then optionally seed data:

8. `seed-roster.sql` (22 players)
9. `seed-money.sql` (sample payments)

### 3. Configure credentials
In **Project Settings > API**, copy your **Project URL** and **anon public** key into `config.js`:

```js
const SUPABASE_URL      = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```

The anon key is safe to ship in frontend code — Row Level Security policies decide what it can actually do. Never put the `service_role` key here.

### 4. Run locally
It's a static site, so any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

## Access model

- **Cup data** (tournaments, matches, goals): anyone can read and write — no login needed.
- **Roster & payment totals**: anyone can read; only logged-in users can add, edit, or delete.
- **Money transactions**: editing is login-gated in the UI.

> Note: payments are publicly *readable* by design so the dashboard can show money totals. Don't store anything sensitive you wouldn't want public.

## Deployment

Being a static site, it can be hosted on any static host (e.g. GitHub Pages, Netlify, Vercel, or Supabase Storage). Just deploy the folder and make sure `config.js` points at your Supabase project.
