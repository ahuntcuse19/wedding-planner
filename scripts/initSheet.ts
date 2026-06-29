// One-time setup for the Google Sheet "backend": creates a tab per entity with
// the correct header row and fills it with demo data so the app works the moment
// it deploys. Re-running is safe — it resets each tab to this known state.
//
// Run locally (after setting the three GOOGLE_* vars in .env):
//   npm run sheets:init
//
// Standalone on purpose: it imports only the dependency-free table definitions
// (no "@/" alias, no Next) so plain `node --experimental-strip-types` can run it.

import path from "node:path";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { TABLES, encode, headersOf, type TableDef } from "../lib/server/tables.ts";

// Load .env locally (Vercel injects env vars directly, but this script is local).
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env is optional — the vars may already be in the environment.
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Set it in .env (see .env.example).`);
    process.exit(1);
  }
  return value;
}

const now = new Date().toISOString();

// Demo data — mirrors the old database seed. `id` and `createdAt`/`updatedAt`
// are filled in automatically below, so they're omitted here.
const SEED: Record<string, Record<string, unknown>[]> = {
  config: [
    {
      date: "2027-04-17",
      backupDate: "2027-04-24",
      location: "Stanfordville, New York",
      venue: "",
      guestTarget: 110,
      budgetMin: 25000,
      budgetMax: 35000,
      partner1Name: "Katie",
      partner2Name: "Me",
      partner1Email: "",
      partner2Email: "",
      chosenVenueId: null,
    },
  ],
  guest: [
    { name: "Sarah & Tom Bennett", party: "Bennett family", side: "Partner1", rsvp: "Yes", email: "sarah.bennett@example.com" },
    { name: "Grandma Rose", party: "Bennett family", side: "Partner1", rsvp: "Yes" },
    { name: "Uncle Pete", party: "Bennett family", side: "Partner1", rsvp: "Maybe" },
    { name: "James Carter", party: "College friends", side: "Partner2", rsvp: "Yes", email: "jcarter@example.com" },
    { name: "Maya Patel +1", party: "College friends", side: "Partner2", rsvp: "Pending" },
    { name: "The Okafor family", party: "Neighbors", side: "Both", rsvp: "Pending" },
    { name: "Lena & Mark", party: "Work (Katie)", side: "Partner1", rsvp: "No", notes: "Out of the country" },
    { name: "Danny Rivera", party: "Work (Me)", side: "Partner2", rsvp: "Yes" },
  ],
  budgetLine: [
    { category: "Venue", item: "Reception venue + tables/chairs", estCost: 12000, actualCost: null, paid: false },
    { category: "Catering", item: "Dinner & service (110 guests)", estCost: 8800, paid: false },
    { category: "Catering", item: "Bar package", estCost: 3200, paid: false },
    { category: "Photography", item: "Photographer (8 hrs)", estCost: 3500, actualCost: 3500, paid: true },
    { category: "Music", item: "DJ + ceremony sound", estCost: 1800, paid: false },
    { category: "Attire", item: "Wedding dress + alterations", estCost: 2200, actualCost: 2450, paid: true },
    { category: "Attire", item: "Suit", estCost: 700, paid: false },
    { category: "Flowers", item: "Bouquets + centerpieces", estCost: 2400, paid: false },
    { category: "Cake", item: "Cake + dessert table", estCost: 900, paid: false },
    { category: "Stationery", item: "Invitations + save-the-dates", estCost: 650, actualCost: 610, paid: true },
  ],
  task: [
    { title: "Finalize guest list", owner: "Both", due: "2026-07-15", status: "Doing", category: "Guests" },
    { title: "Tour shortlisted venues", owner: "Partner1", due: "2026-07-01", status: "Doing", category: "Venue" },
    { title: "Book photographer", owner: "Partner2", due: "2026-06-30", status: "Done", category: "Vendors" },
    { title: "Send save-the-dates", owner: "Partner1", due: "2026-09-01", status: "Todo", category: "Stationery" },
    { title: "Choose caterer & menu tasting", owner: "Both", due: "2026-08-15", status: "Todo", category: "Catering" },
    { title: "Order wedding dress", owner: "Partner1", due: "2026-08-01", status: "Done", category: "Attire" },
    { title: "Get fitted for suit", owner: "Partner2", due: "2026-11-01", status: "Todo", category: "Attire" },
    { title: "Book DJ", owner: "Partner2", due: "2026-09-15", status: "Todo", category: "Vendors" },
    { title: "Coordinate day-of timeline", owner: "Coordinator", due: "2027-03-01", status: "Todo", category: "Logistics" },
    { title: "Confirm floral order", owner: "Vendor", due: "2027-03-20", status: "Todo", category: "Flowers" },
    { title: "Plan ceremony readings", owner: "Both", due: "2027-02-01", status: "Todo", category: "Ceremony" },
    { title: "Set up wedding website", owner: "Partner2", due: "2026-08-20", status: "Doing", category: "Stationery" },
  ],
  vendor: [
    { name: "Evergreen Photography", category: "Photography", status: "Booked", cost: 3500, contact: "hello@evergreenphoto.example", url: "https://evergreenphoto.example" },
    { name: "Garden Table Catering", category: "Catering", status: "Contacted", cost: 12000, contact: "events@gardentable.example" },
    { name: "Spin City DJs", category: "Music", status: "Researching", cost: 1800 },
    { name: "Petal & Stem Florals", category: "Flowers", status: "Contacted", cost: 2400, contact: "petalstem@example.com" },
    { name: "Sweet Layers Bakery", category: "Cake", status: "Researching", cost: 900 },
    { name: "Day-Of Coordination Co.", category: "Planning", status: "Booked", cost: 1500, contact: "book@dayofco.example" },
  ],
  venue: [
    { name: "The Old Mill Barn", location: "Hudson Valley, NY", capacity: 140, estCost: 11000, pricePerHead: null, status: "Shortlist", url: "https://oldmillbarn.example", contact: "events@oldmillbarn.example", pros: "Rustic charm, on-site lodging, beautiful grounds", cons: "Hour from the city, rain plan limited", source: "manual" },
    { name: "Riverside Loft", location: "Brooklyn, NY", capacity: 90, estCost: 14000, pricePerHead: 120, status: "Toured", url: "https://riversideloft.example", contact: "booking@riversideloft.example", pros: "Skyline views, easy for city guests, modern", cons: "Capacity tight for our list, pricey bar minimum", source: "manual" },
    { name: "Lakeside Pavilion", location: "Princeton, NJ", capacity: 160, estCost: 9500, pricePerHead: null, status: "Considering", url: "https://lakesidepavilion.example", pros: "Affordable, big capacity, lakeside ceremony spot", cons: "Dated interior, need outside caterer", source: "manual" },
  ],
  emailLog: [],
};

// Turn a seed object into a full {column: cellString} row, assigning the id and
// any timestamp columns, then encoding each value the way the app expects.
function toCells(def: TableDef, data: Record<string, unknown>, id: number): Record<string, string> {
  const cells: Record<string, string> = {};
  for (const col of def.columns) {
    let value: unknown;
    if (col.name === "id") value = id;
    else if (col.name in data) value = data[col.name];
    else if (col.name === "createdAt" || col.name === "updatedAt" || col.name === "sentAt") value = now;
    else value = undefined; // encode → "" ; the app fills defaults on later writes
    cells[col.name] = encode(col, value);
  }
  return cells;
}

async function main() {
  const jwt = new JWT({
    email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(requireEnv("GOOGLE_SHEETS_ID"), jwt);
  await doc.loadInfo();
  console.log(`Connected to "${doc.title}".`);

  for (const [key, def] of Object.entries(TABLES) as [string, TableDef][]) {
    const headers = headersOf(def);
    let sheet = doc.sheetsByTitle[def.title];

    if (!sheet) {
      sheet = await doc.addSheet({ title: def.title, headerValues: headers });
    } else {
      await sheet.clear();
      await sheet.setHeaderRow(headers);
    }

    const seed = SEED[key] ?? [];
    const rows = seed.map((data, i) => toCells(def, data, i + 1));
    if (rows.length) await sheet.addRows(rows);

    console.log(`  ${def.title}: headers + ${rows.length} row(s).`);
  }

  console.log("Done. Your Google Sheet is ready to use as the app's backend.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
