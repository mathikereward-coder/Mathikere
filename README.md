# Mathikere Ward — Voter CRM & Field App

A mobile-friendly web app (PWA) for door-to-door voter data collection in **Mathikere Ward, Bangalore**, plus an office admin dashboard.

- **Field team:** bilingual (English + ಕನ್ನಡ) form, works **fully offline**, syncs when back online.
- **Admin (you):** dashboard with booth-wise stats, scheme/issue breakdowns, team activity, and Excel export.
- **Access control:** field workers only see their own/assigned booths; admin sees everything (enforced in the database).

Built with React + Vite (frontend), Supabase (database + logins), hosted on Render.

---

## What's already built
- Login screen
- Offline-first field form (household + multiple voters, schemes, issues, GPS tag)
- On-device queue + auto-sync (the "X waiting to sync" badge)
- Admin dashboard (charts + Excel export)
- Households list with search + export
- Full database schema with security rules: `supabase/schema.sql`

## What to do when you wake up (≈20 min)

### 1) Create the Supabase project (the database + logins)
1. Sign up free at https://supabase.com → **New project**. Pick a name, a strong DB password, region **Mumbai/Singapore**.
2. Open **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, click **Run**. This creates all tables + security rules.
3. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key.

### 2) Connect the app
1. In this folder, copy `.env.example` to `.env`.
2. Paste your two values:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ....
   ```
3. Run it locally: `npm install` then `npm run dev`, open the shown URL.

### 3) Create your admin login + field workers
1. In Supabase → **Authentication → Users → Add user** → create your own email + password (and the 23 field workers, or let them self-signup later).
2. Make yourself admin — Supabase **SQL Editor**, run (use your email):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Assign a worker to booths (example: worker covers booths 5 and 6):
   ```sql
   insert into public.supporter_booths (user_id, booth_number)
   values ((select id from auth.users where email='worker@example.com'), 5),
          ((select id from auth.users where email='worker@example.com'), 6);
   ```

### 4) Put it online (Render)
1. Push this folder to a GitHub repo.
2. Render → **New → Static Site** → connect the repo.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Add the two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
   - Add a rewrite rule: source `/*` → destination `/index.html` (so page refresh works).
3. Field workers open the Render URL on their phone → browser menu → **Add to Home Screen**. It now behaves like an app and works offline.

---

## Notes / decisions
- **APL/BPL** is a single choice (APL / BPL / None) since a household holds one ration card.
- **Schemes & Issues** are multi-select (a family can have several).
- **Family members** = add a voter row per person; stored as separate `voters` linked to one `household`.
- **Privacy (DPDP Act 2023):** every record carries a consent note; access is locked per booth. Don't share the anon key publicly beyond the app.
- **Duplicates:** Voter ID is indexed; a "find duplicates" report can be added next.

## Still to do (next session)
- Admin screen to add/assign field workers from the UI (currently done via Supabase).
- Map view of GPS-tagged issues.
- Duplicate-voter report.
- Replace `public/icon.svg` with the candidate's logo.
