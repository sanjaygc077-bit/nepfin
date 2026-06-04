# NEP Cali Manager

A lightweight, mobile-first web app for running an amateur football club — **NepCali FC**. It handles the tournament cup, squad roster, club finances, a live dashboard, and a drag-to-pick Starting XI, all backed by a real database and synced live across every device.

**Live demo:** https://sanjaygc077-bit.github.io/nepfin/

![NepCali FC](club-banner.png)

---

## Features

- **Tournament Cup** — live scores, league table, knockouts, and an auto-ranked top-scorers list. Fixtures are generated round-robin from the number of teams.
- **Roster** — add, edit, and remove players inline; assign teams and positions.
- **Money** — track member fees and balances (collected / spent / balance), login-protected.
- **Dashboard** — upcoming tournament and events, plus a club-wide money overview.
- **Starting XI** — pick a formation and tap to fill each position on the pitch.
- **Live sync** — every signed-in device sees the same data in real time (Supabase).
- **Privacy-friendly usage counter** — counts unique visitors via a salted SHA-256 hash of the IP; raw IP addresses are never stored.

## Access model

| Data | Read | Write |
| --- | --- | --- |
| Tournament (scores, fixtures, goals) | Public | Public |
| Roster & money totals | Public | Logged-in only |
| Adding/editing players & payments | — | Logged-in only |

Access is enforced by **PostgreSQL Row Level Security (RLS)** policies, not just the UI.

## Tech stack

- **Frontend:** Vanilla HTML, CSS, and JavaScript — separated into `index.html` / `styles.css` / `app.js`, no build step, no framework.
- **Backend:** [Supabase](https://supabase.com/) — PostgreSQL, Row Level Security, and Auth.
- **Client SDK:** `@supabase/supabase-js` v2 (loaded via CDN).
- **Hosting:** GitHub Pages.

## Project structure

```
nepfin/
├── index.html            # Markup / page structure
├── styles.css            # All styling
├── app.js                # App logic (data, rendering, auth, tournament)
├── config.js             # Supabase URL + anon (publishable) key
├── club-banner.png       # Hero/banner image
└── db/                   # Database schema + seed scripts (run in order)
    ├── schema.sql            # 1. Core tables (players, payments)
    ├── schema-tournament.sql # 2. Tournament, matches, goals
    ├── schema-access.sql     # 3. Access rules (public vs. logged-in)
    ├── schema-public-read.sql# 4. Public read for roster + dashboard
    ├── schema-dashboard.sql  # 5. Dashboard settings + Starting XI
    ├── schema-usage.sql      # 6. Privacy-safe visitor counter
    ├── seed-roster.sql       # (optional) seed 22 players
    └── seed-money.sql        # (optional) seed budget data
```

## Setup

### 1. Create a Supabase project
Sign up at [supabase.com](https://supabase.com/) and create a new project.

### 2. Run the database scripts
In the Supabase dashboard, open **SQL Editor → New query** and run each file in `db/` **in this order**:

1. `schema.sql`
2. `schema-tournament.sql`
3. `schema-access.sql`
4. `schema-public-read.sql`
5. `schema-dashboard.sql`
6. `schema-usage.sql`

Optionally seed sample data with `seed-roster.sql` and `seed-money.sql`.

### 3. Configure the app
In **Project Settings → API**, copy your **Project URL** and **anon public** key into `config.js`:

```js
const SUPABASE_URL      = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-public-key";
```

> The **anon** key is safe to ship in frontend code — it only allows what your RLS policies permit. Never commit the **service_role** key.

### 4. Run it
Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

### 5. Deploy (GitHub Pages)
Push to GitHub, then enable **Settings → Pages → Deploy from branch → main / root**.

## License

[MIT](LICENSE) © Sanjay GC
