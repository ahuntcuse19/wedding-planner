import { GoogleSpreadsheet } from "google-spreadsheet";
import type {
  GoogleSpreadsheetWorksheet,
  GoogleSpreadsheetRow,
} from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { HttpError } from "@/lib/server/errors";
import {
  TABLES,
  TIMESTAMP_COLUMNS,
  colDefault,
  decode,
  encode,
  type Col,
  type TableDef,
  type TableName,
} from "@/lib/server/tables";

// ---------------------------------------------------------------------------
// Google Sheets as the database. One spreadsheet, one tab per entity. Replaces
// Prisma/Postgres: no connection string, no migrations — the couple can also
// edit the data directly in Google Sheets.
//
// Auth is a Google service account (three env vars below). Connection + sheet
// metadata are cached per warm serverless instance; row data is always fetched
// fresh so concurrent edits (app + the live sheet) stay consistent.
// ---------------------------------------------------------------------------

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new HttpError(
      500,
      `${name} is not set. Configure the Google Sheets service account (see .env.example).`,
    );
  }
  return value;
}

let docPromise: Promise<GoogleSpreadsheet> | null = null;

async function getDoc(): Promise<GoogleSpreadsheet> {
  if (!docPromise) {
    docPromise = (async () => {
      const jwt = new JWT({
        email: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
        // Vercel stores the multi-line PEM key with literal "\n"; restore them.
        key: requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
        scopes: SCOPES,
      });
      const doc = new GoogleSpreadsheet(requireEnv("GOOGLE_SHEETS_ID"), jwt);
      await doc.loadInfo();
      return doc;
    })().catch((err) => {
      // Drop the cached failure so the next request can retry (e.g. transient
      // network blip or env vars added after a cold start).
      docPromise = null;
      throw err;
    });
  }
  return docPromise;
}

async function worksheet(def: TableDef): Promise<GoogleSpreadsheetWorksheet> {
  const doc = await getDoc();
  const sheet = doc.sheetsByTitle[def.title];
  if (!sheet) {
    throw new HttpError(
      500,
      `Spreadsheet tab "${def.title}" not found. Run \`npm run sheets:init\` to create the tabs.`,
    );
  }
  return sheet;
}

type Row = Record<string, unknown>;

function rowToObject(def: TableDef, row: GoogleSpreadsheetRow): Row {
  const obj: Row = {};
  for (const col of def.columns) obj[col.name] = decode(col, row.get(col.name));
  return obj;
}

const nowISO = () => new Date().toISOString();

function findRow(
  rows: GoogleSpreadsheetRow[],
  idCol: Col,
  id: number,
): GoogleSpreadsheetRow | undefined {
  return rows.find((r) => decode(idCol, r.get("id")) === id);
}

// The methods the generic CRUD routes rely on (mirrors the old Prisma delegate),
// plus findById for the venue/config special routes.
export interface Repo {
  findMany(opts?: { orderBy?: { id: "asc" | "desc" } }): Promise<Row[]>;
  findById(id: number): Promise<Row | null>;
  create(args: { data: Row }): Promise<Row>;
  update(args: { where: { id: number }; data: Row }): Promise<Row>;
  delete(args: { where: { id: number } }): Promise<Row>;
}

function makeRepo(def: TableDef): Repo {
  const idCol = def.columns.find((col) => col.name === "id")!;
  const hasUpdatedAt = def.columns.some((col) => col.name === "updatedAt");

  return {
    async findMany(opts) {
      const sheet = await worksheet(def);
      const rows = await sheet.getRows();
      const items = rows.map((r) => rowToObject(def, r));
      const dir = opts?.orderBy?.id === "desc" ? -1 : 1;
      items.sort((a, b) => dir * ((a.id as number) - (b.id as number)));
      return items;
    },

    async findById(id) {
      const sheet = await worksheet(def);
      const rows = await sheet.getRows();
      const row = findRow(rows, idCol, id);
      return row ? rowToObject(def, row) : null;
    },

    async create({ data }) {
      const sheet = await worksheet(def);
      const rows = await sheet.getRows();
      // Sheets has no autoincrement — derive the next id from existing rows.
      const nextId =
        rows.reduce((max, r) => Math.max(max, Number(decode(idCol, r.get("id"))) || 0), 0) + 1;

      const record: Row = { id: nextId };
      for (const col of def.columns) {
        if (col.name === "id") continue;
        if (col.name in data && data[col.name] !== undefined) {
          record[col.name] = data[col.name];
        } else if (TIMESTAMP_COLUMNS.has(col.name)) {
          record[col.name] = nowISO();
        } else {
          record[col.name] = colDefault(col);
        }
      }

      const cells: Record<string, string> = {};
      for (const col of def.columns) cells[col.name] = encode(col, record[col.name]);
      await sheet.addRow(cells);
      return record;
    },

    async update({ where: { id }, data }) {
      const sheet = await worksheet(def);
      const rows = await sheet.getRows();
      const row = findRow(rows, idCol, id);
      if (!row) throw new HttpError(404, "Not found.");

      const patch: Record<string, string> = {};
      for (const col of def.columns) {
        if (col.name === "id") continue;
        if (col.name in data && data[col.name] !== undefined) {
          patch[col.name] = encode(col, data[col.name]);
        }
      }
      if (hasUpdatedAt) patch.updatedAt = nowISO();

      row.assign(patch);
      await row.save();
      return rowToObject(def, row);
    },

    async delete({ where: { id } }) {
      const sheet = await worksheet(def);
      const rows = await sheet.getRows();
      const row = findRow(rows, idCol, id);
      if (!row) throw new HttpError(404, "Not found.");
      const obj = rowToObject(def, row);
      await row.delete();
      return obj;
    },
  };
}

export const repos: Record<TableName, Repo> = {
  config: makeRepo(TABLES.config),
  budgetLine: makeRepo(TABLES.budgetLine),
  guest: makeRepo(TABLES.guest),
  task: makeRepo(TABLES.task),
  vendor: makeRepo(TABLES.vendor),
  venue: makeRepo(TABLES.venue),
  emailLog: makeRepo(TABLES.emailLog),
};

// Config is a singleton (id = 1). Read it, creating a default row on first use.
export async function getConfig(): Promise<Row> {
  const existing = await repos.config.findMany({ orderBy: { id: "asc" } });
  if (existing.length) return existing[0];
  return repos.config.create({ data: { date: "", location: "", venue: "" } });
}

// Read the config without creating one — for read-only paths (digests) that
// shouldn't write as a side effect. Returns null when no config row exists yet.
export async function readConfig(): Promise<Row | null> {
  const existing = await repos.config.findMany({ orderBy: { id: "asc" } });
  return existing[0] ?? null;
}
