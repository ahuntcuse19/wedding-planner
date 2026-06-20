# Wedding Planner

A full-stack wedding-planning app: venues, guests, budget, timeline, vendors, a
chosen-venue–driven location, partner task assignment, and emailed digests.

Built with **Next.js (App Router) + TypeScript + Tailwind + Postgres (Prisma) + Resend**,
deployable to **Vercel**.

## Architecture (the anti-tech-debt core)

- **Central theme tokens** — all colors/typography live in `lib/theme.ts` (`C`, `F`)
  and `app/globals.css`. Change the look in one place.
- **Single data layer** — generic REST route handlers (`app/api/[entity]`,
  `app/api/[entity]/[id]`) back every entity. The client talks to them only
  through one hook: `useEntity('guests' | 'budget' | 'tasks' | 'vendors' | 'venues')`
  (`hooks/useEntity.ts`) plus `useConfig()` for the settings singleton. No
  scattered `fetch` calls in the modules.
- **Schema-driven UI** — `lib/schemas.ts` defines the fields for each entity once.
  `EntityEditor` renders the form, `CrudList` renders the list, and the server
  uses the same schema to sanitize input. Add a field once → it appears in the
  form, the list, and the API.

## Setup (local)

The app uses **Postgres** (so it runs the same locally and on Vercel). The
easiest local database is a free **Neon** branch — no install required.

1. Create a project at <https://neon.tech> and copy its connection strings.
2. Configure env and run:

```bash
npm install
cp .env.example .env        # set DATABASE_URL + DIRECT_URL (Neon), then other keys
npx prisma migrate deploy   # apply migrations to your database
npm run seed                # load sample guests, budget, tasks, vendors, venues
npm run dev                 # http://localhost:3000
```

- `DATABASE_URL` = Neon **pooled** connection (the `-pooler` host).
- `DIRECT_URL` = Neon **direct** connection (used for migrations).

The app runs fully **without any email/search API keys** — those features stay
disabled (and say so) until you add keys.

To reset the database to seed state at any time: `npm run db:reset`.

> Prefer SQLite for purely-local work? You can switch `provider` back to
> `"sqlite"` in `prisma/schema.prisma` and use `DATABASE_URL="file:./dev.db"`,
> but Vercel's serverless filesystem is ephemeral, so production needs Postgres.

## Modules

- **Dashboard** — countdown, headcount vs target, budget vs range (flags overage),
  open tasks by owner, vendor status.
- **Venues** — compare cards, filter by status, **Set as our venue** (writes the
  location into Settings and warns if capacity < guest target). Optional live
  search (below).
- **Guests / Budget / Vendors** — schema-driven CRUD lists.
- **Timeline** — tasks with owner filters and quick views (**"Katie's tasks"**,
  **"My tasks"**) driven by the partner names in Settings, never hardcoded.
- **Settings** — wedding date, optional **backup date**, location, venue, guest
  target, budget range, and the two **partner names + emails**.
- **Digest** — send a summary email now, view the send history.

## Adding API keys

All keys go in `.env` (never committed). See `.env.example` for the full list.

### Email digests (Resend)

1. Create an account at <https://resend.com> and an API key.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env`.
   - With no verified domain, use the sandbox sender `onboarding@resend.dev`.
   - To send from your own domain, verify it in Resend and use e.g.
     `Wedding Planner <planner@yourdomain.com>`.
3. Add both partners' emails in **Settings**. Digests are sent **only** to those
   two addresses — never to guests.
4. Use **Digest → Send digest now**, or schedule the weekly send (below).

### Live venue search (Google Places — optional)

1. In Google Cloud, enable the **Places API (New)** and create an API key with
   billing enabled.
2. Set `VENUE_SEARCH_ENABLED="true"` and `PLACES_API_KEY` in `.env`.
3. A search box appears on the Venues page. Results come **only** from Google —
   nothing is fabricated — and each links back to its source. Save any result to
   your venues list.

If the flag is off or the key is missing, the search box is hidden and venues are
manual-entry only.

## Scheduling the weekly digest

The weekly digest is a protected route: `GET /api/cron/digest`. It requires
`CRON_SECRET` (set one in `.env`, e.g. `openssl rand -hex 32`) sent either as
`Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>`. It also guards
against double-sends within the same day. **Default cadence: Sunday 18:00.**

**Option A — Vercel Cron** (when deployed to Vercel). Already wired in
`vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/digest", "schedule": "0 18 * * 0" }] }
```

Set `CRON_SECRET` in the Vercel project env. Vercel Cron automatically sends
`Authorization: Bearer <CRON_SECRET>`. (Cron times are UTC — adjust the hour for
your timezone.)

**Option B — node-cron worker / system cron** (self-hosted). Any scheduler that
can make an HTTP request works, e.g. a crontab entry:

```cron
0 18 * * 0 curl -s "https://your-app.example/api/cron/digest?secret=$CRON_SECRET"
```

or a small `node-cron` script:

```js
import cron from "node-cron";
cron.schedule("0 18 * * 0", () => {
  fetch(`${process.env.APP_URL}/api/cron/digest?secret=${process.env.CRON_SECRET}`);
});
```

## Deploy to Vercel

The repo is Vercel-ready: `vercel.json` registers the weekly cron, `next.config.ts`
externalizes Prisma for serverless, and the `vercel-build` script runs
`prisma generate && prisma migrate deploy && next build` so the schema is applied
on every deploy.

1. **Database** — create a Postgres database:
   - **Neon**: create a project, grab the pooled + direct connection strings.
   - **Vercel Postgres**: add it from the project's Storage tab — it injects
     `POSTGRES_*` env vars automatically.
2. **Import the repo** into Vercel (New Project → pick this Git repo). Framework
   auto-detects as Next.js.
3. **Set environment variables** in the Vercel project (Settings → Environment
   Variables):

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | pooled Postgres URL (Vercel Postgres: `POSTGRES_PRISMA_URL`) |
   | `DIRECT_URL` | direct Postgres URL (Vercel Postgres: `POSTGRES_URL_NON_POOLING`) |
   | `RESEND_API_KEY` | your Resend key (optional — blank disables email) |
   | `EMAIL_FROM` | verified sender, or `onboarding@resend.dev` |
   | `CRON_SECRET` | `openssl rand -hex 32` (required for the weekly digest) |
   | `VENUE_SEARCH_ENABLED` / `PLACES_API_KEY` | optional venue search |

4. **Deploy.** `vercel-build` applies migrations automatically. Migrations do **not**
   seed — run the seed once against the production DB if you want sample data:
   `DATABASE_URL=<prod-url> DIRECT_URL=<prod-direct-url> npm run seed` (or just add
   your real data through the UI).
5. The weekly digest fires Sundays 18:00 **UTC** — adjust the schedule in
   `vercel.json` for your timezone.

> Note: SQLite can't be used in production — Vercel's serverless filesystem is
> ephemeral and read-only, so the app uses Postgres everywhere.

## Costs

- **Postgres (Neon / Vercel Postgres)** — both have free tiers that comfortably
  cover a single wedding's data. Neon's free branch is enough for local + prod.
- **Resend** — free tier ~3,000 emails/month (100/day), plenty for two recipients.
  No verified domain needed for the sandbox sender.
- **Google Places API (New)** — pay-as-you-go with a recurring free credit, but
  **Text Search is billed per request** beyond the free allotment. Keep
  `VENUE_SEARCH_ENABLED="false"` to avoid any Places billing; set quotas to cap spend.
- **Vercel / Prisma / Next.js** — Vercel's Hobby tier is free for personal projects.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled Postgres connection (runtime) |
| `DIRECT_URL` | yes | Direct Postgres connection (migrations) |
| `RESEND_API_KEY` | for email | Resend API key; blank = email disabled |
| `EMAIL_FROM` | for email | Verified/sandbox sender address |
| `CRON_SECRET` | for weekly digest | Shared secret protecting the cron route |
| `VENUE_SEARCH_ENABLED` | no | `"true"` to enable live venue search |
| `PLACES_API_KEY` | for search | Google Places API (New) key |
