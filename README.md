# Wedding Planner

A full-stack wedding-planning app: venues, guests, budget, timeline, vendors, a
chosen-venue–driven location, partner task assignment, and emailed digests.

Built with **Next.js (App Router) + TypeScript + Tailwind + SQLite (Prisma) + Resend**.

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

## Setup

```bash
npm install
cp .env.example .env        # then fill in values as needed (see below)
npx prisma migrate dev      # create the SQLite database + tables
npm run seed                # load sample guests, budget, tasks, vendors, venues
npm run dev                 # http://localhost:3000
```

The app runs fully **without any API keys** — email sending and live venue search
simply stay disabled (and say so) until you add keys.

To reset the database to seed state at any time: `npm run db:reset`.

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

**Option A — Vercel Cron** (when deployed to Vercel). Add `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/digest", "schedule": "0 18 * * 0" }]
}
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

## Costs

- **Resend** — free tier is ~3,000 emails/month (100/day), plenty for two
  recipients. Paid tiers only matter at volume. No verified domain needed for the
  sandbox sender.
- **Google Places API (New)** — pay-as-you-go with a recurring free credit, but
  **Text Search is billed per request** beyond the free allotment. Keep
  `VENUE_SEARCH_ENABLED="false"` if you don't want any Places billing. Set quotas
  in Google Cloud to cap spend.
- **SQLite / Prisma / Next.js** — free and local.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | SQLite file path for Prisma |
| `RESEND_API_KEY` | for email | Resend API key; blank = email disabled |
| `EMAIL_FROM` | for email | Verified/sandbox sender address |
| `CRON_SECRET` | for weekly digest | Shared secret protecting the cron route |
| `VENUE_SEARCH_ENABLED` | no | `"true"` to enable live venue search |
| `PLACES_API_KEY` | for search | Google Places API (New) key |
