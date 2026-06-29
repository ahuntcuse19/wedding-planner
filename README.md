# Wedding Planner

A full-stack wedding-planning app: venues, guests, budget, timeline, vendors, a
chosen-venue–driven location, partner task assignment, and emailed digests.

Built with **Next.js (App Router) + TypeScript + Tailwind + Google Sheets + Resend**,
deployable to **Vercel**.

> **Backend:** there's no database. All data lives in one **Google Sheet** — a
> tab per entity (Guests, Budget, Tasks, Vendors, Venues, Config, EmailLog). The
> app reads and writes it through a Google service account, and you can also edit
> the data directly in Google Sheets. No connection string, no migrations.

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

The app stores everything in a **Google Sheet**, accessed through a Google Cloud
**service account**. One-time setup:

1. **Create the sheet.** Make a blank Google Sheet and copy its id from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`.
2. **Create a service account.** In the [Google Cloud Console](https://console.cloud.google.com):
   create (or pick) a project → **APIs & Services → Library → enable "Google
   Sheets API"** → **Credentials → Create credentials → Service account** →
   open it → **Keys → Add key → JSON**. The downloaded JSON has `client_email`
   and `private_key`.
3. **Share the sheet** with that `client_email` as an **Editor**.
4. **Configure env and seed the tabs:**

```bash
npm install
cp .env.example .env        # set the three GOOGLE_* vars, then other keys
npm run sheets:init         # creates a tab per entity + loads sample data
npm run dev                 # http://localhost:3000
```

`.env` needs three values (all also go in the Vercel dashboard):

- `GOOGLE_SHEETS_ID` — the id from step 1.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the JSON's `client_email`.
- `GOOGLE_PRIVATE_KEY` — the JSON's `private_key`, in quotes, keeping the literal
  `\n` sequences (the app turns them back into newlines).

The app runs fully **without any email/search API keys** — those features stay
disabled (and say so) until you add keys.

To reset the tabs to sample data at any time: `npm run sheets:init` (it clears
and re-seeds every tab).

> **Bringing your own data (e.g. an existing Excel guest list)?** Run
> `npm run sheets:init` once to create the tabs with the right headers, then in
> Google Sheets use **File → Import → Upload** into the matching tab (e.g.
> *Guests*), choosing **Replace current sheet**. Keep the header row names
> intact — the app reads columns by name. Leave the `id` column blank for new
> rows and the app/sheet will assign ids on the next write.

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

## Access (password gate)

The app and all its API routes can be protected by a single **shared password**
(no user accounts). Set both env vars to enable it:

- `APP_PASSWORD` — the password you'll type to sign in.
- `AUTH_SECRET` — signs the session cookie; generate one with `openssl rand -hex 32`.

When set, unauthenticated visitors are redirected to `/login` and API calls
return `401`. A signed, httpOnly cookie keeps you logged in for 30 days; use
**Log out** in the header to clear it. The weekly cron route (`/api/cron/digest`)
is exempt — it stays protected by `CRON_SECRET` instead. If either var is unset
the gate is **disabled** (the app is open), so a missing var can't lock you out.

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

The repo is Vercel-ready: `vercel.json` sets the framework + cron, `next.config.ts`
keeps the Google Sheets client external for serverless, and the standard
`next build` is all the deploy needs — no database, no migrations.

1. **Backend** — do the Google Sheet + service-account setup from
   [Setup (local)](#setup-local) (create the sheet, enable the Sheets API, make a
   service account, share the sheet, run `npm run sheets:init` once).
2. **Import the repo** into Vercel (New Project → pick this Git repo). Framework
   auto-detects as Next.js.
3. **Set the environment variables** (Settings → Environment Variables). Add the
   three `GOOGLE_*` vars for **all** environments (Production, Preview, **and**
   Development — PR deploys are Preview builds):

   | Variable | Value |
   | --- | --- |
   | `GOOGLE_SHEETS_ID` | the spreadsheet id (required) |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | the service account's `client_email` (required) |
   | `GOOGLE_PRIVATE_KEY` | the service account's `private_key`, quoted, with literal `\n` (required) |
   | `APP_PASSWORD` / `AUTH_SECRET` | enable the shared-password gate (recommended for a public URL) |
   | `RESEND_API_KEY` | your Resend key (optional — blank disables email) |
   | `EMAIL_FROM` | verified sender, or `onboarding@resend.dev` |
   | `CRON_SECRET` | `openssl rand -hex 32` (required for the weekly digest) |
   | `VENUE_SEARCH_ENABLED` / `PLACES_API_KEY` | optional venue search |

4. **Deploy.** The build needs no data access; the app connects to the sheet at
   request time. Add your real data through the UI, or in Google Sheets directly.
5. The weekly digest fires Sundays 18:00 **UTC** — adjust the schedule in
   `vercel.json` for your timezone.

> Because the data lives in Google Sheets (not a file on disk), writes persist
> fine on Vercel's ephemeral, read-only serverless filesystem.

## Continuous integration

`.github/workflows/ci.yml` runs on every PR and push to `main`: it installs deps,
then runs **ESLint** (`npm run lint`) and a **TypeScript** check
(`npm run typecheck`). No backend access is needed. Run the same checks locally
with `npm run lint && npm run typecheck`.

## Costs

- **Google Sheets API** — free. Generous default quotas (hundreds of reads/writes
  per minute), far beyond what one couple's planning generates.
- **Resend** — free tier ~3,000 emails/month (100/day), plenty for two recipients.
  No verified domain needed for the sandbox sender.
- **Google Places API (New)** — pay-as-you-go with a recurring free credit, but
  **Text Search is billed per request** beyond the free allotment. Keep
  `VENUE_SEARCH_ENABLED="false"` to avoid any Places billing; set quotas to cap spend.
- **Vercel / Next.js** — Vercel's Hobby tier is free for personal projects.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_SHEETS_ID` | yes | Id of the Google Sheet used as the backend |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | yes | Service account `client_email` (must have Editor access to the sheet) |
| `GOOGLE_PRIVATE_KEY` | yes | Service account `private_key` (quoted, literal `\n` preserved) |
| `APP_PASSWORD` | for the gate | Shared password; blank = app open |
| `AUTH_SECRET` | for the gate | Signs the session cookie (`openssl rand -hex 32`) |
| `RESEND_API_KEY` | for email | Resend API key; blank = email disabled |
| `EMAIL_FROM` | for email | Verified/sandbox sender address |
| `CRON_SECRET` | for weekly digest | Shared secret protecting the cron route |
| `VENUE_SEARCH_ENABLED` | no | `"true"` to enable live venue search |
| `PLACES_API_KEY` | for search | Google Places API (New) key |
