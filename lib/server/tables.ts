// Spreadsheet "schema" — one tab per entity, mirroring the old Prisma models.
// This module is intentionally DEPENDENCY-FREE (no Next, no @/ imports) so it can
// be shared by both the runtime data layer (lib/server/sheets.ts) and the
// standalone setup script (scripts/initSheet.ts, run under plain `node`).
//
// Google Sheets stores every cell as text, so each column carries a type that
// drives encode (JS value → cell string) and decode (cell string → JS value).
// The column NAMES here must match the field names in lib/types.ts exactly —
// the app reads/writes cells by header name, so the order of columns is cosmetic
// but the names are load-bearing.

export type ColType = "int" | "float" | "bool" | "string";

export interface Col {
  name: string;
  type: ColType;
  // Empty cell decodes to null (not 0/"") and the column may hold blanks.
  nullable?: boolean;
  // Value used on create when the field is absent from the submitted data.
  default?: unknown;
}

export interface TableDef {
  // The worksheet (tab) title in the Google Sheet.
  title: string;
  columns: Col[];
}

const c = (name: string, type: ColType = "string", nullable = false, def?: unknown): Col => ({
  name,
  type,
  nullable,
  default: def,
});

// Auto-managed timestamp columns: filled with "now" on create (and updatedAt is
// refreshed on every update — see sheets.ts).
export const TIMESTAMP_COLUMNS = new Set(["createdAt", "updatedAt", "sentAt"]);

export const TABLES = {
  config: {
    title: "Config",
    columns: [
      c("id", "int"),
      c("date"),
      c("backupDate", "string", true),
      c("location"),
      c("venue"),
      c("guestTarget", "int", false, 100),
      c("budgetMin", "int"),
      c("budgetMax", "int"),
      c("partner1Name", "string", false, "Katie"),
      c("partner2Name", "string", false, "Me"),
      c("partner1Email", "string", true),
      c("partner2Email", "string", true),
      c("chosenVenueId", "int", true),
      c("updatedAt"),
    ],
  },
  budgetLine: {
    title: "Budget",
    columns: [
      c("id", "int"),
      c("category"),
      c("item"),
      c("estCost", "int"),
      c("actualCost", "int", true),
      c("paid", "bool"),
      c("notes"),
      c("createdAt"),
    ],
  },
  guest: {
    title: "Guests",
    columns: [
      c("id", "int"),
      c("name"),
      c("party"),
      c("side", "string", false, "Both"),
      c("rsvp", "string", false, "Pending"),
      c("email", "string", true),
      c("notes"),
      c("createdAt"),
    ],
  },
  task: {
    title: "Tasks",
    columns: [
      c("id", "int"),
      c("title"),
      c("owner", "string", false, "Both"),
      c("due", "string", true),
      c("status", "string", false, "Todo"),
      c("category"),
      c("notes"),
      c("createdAt"),
    ],
  },
  vendor: {
    title: "Vendors",
    columns: [
      c("id", "int"),
      c("name"),
      c("category"),
      c("status", "string", false, "Researching"),
      c("cost", "int", true),
      c("contact"),
      c("url"),
      c("notes"),
      c("createdAt"),
    ],
  },
  venue: {
    title: "Venues",
    columns: [
      c("id", "int"),
      c("name"),
      c("location"),
      c("lat", "float", true),
      c("lng", "float", true),
      c("capacity", "int"),
      c("estCost", "int"),
      c("pricePerHead", "int", true),
      c("status", "string", false, "Considering"),
      c("url"),
      c("contact"),
      c("pros"),
      c("cons"),
      c("notes"),
      c("source", "string", false, "manual"),
      c("createdAt"),
    ],
  },
  emailLog: {
    title: "EmailLog",
    columns: [
      c("id", "int"),
      c("sentAt"),
      c("type"),
      c("recipients"),
      c("subject"),
      c("status", "string", false, "sent"),
      c("error", "string", true),
      c("snapshot", "string", false, "{}"),
    ],
  },
} satisfies Record<string, TableDef>;

export type TableName = keyof typeof TABLES;

// Cell text → typed JS value.
export function decode(col: Col, raw: unknown): unknown {
  const s = raw === undefined || raw === null ? "" : String(raw).trim();
  switch (col.type) {
    case "int":
    case "float": {
      if (s === "") return col.nullable ? null : 0;
      const n = Number(s);
      if (!Number.isFinite(n)) return col.nullable ? null : 0;
      return col.type === "int" ? Math.round(n) : n;
    }
    case "bool":
      return /^(true|1|yes)$/i.test(s);
    default:
      return s === "" && col.nullable ? null : s;
  }
}

// Typed JS value → cell text.
export function encode(col: Col, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (col.type === "bool") return value ? "TRUE" : "FALSE";
  return String(value);
}

// Value to use when a column is missing from create input.
export function colDefault(col: Col): unknown {
  if (col.default !== undefined) return col.default;
  if (col.nullable) return null;
  switch (col.type) {
    case "int":
    case "float":
      return 0;
    case "bool":
      return false;
    default:
      return "";
  }
}

export const headersOf = (def: TableDef): string[] => def.columns.map((col) => col.name);
