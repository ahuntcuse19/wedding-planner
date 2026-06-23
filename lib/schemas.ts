// The schema-driven core. One field descriptor list per entity drives both the
// form (EntityEditor) and the list/cards (CrudList), AND the server-side input
// sanitization. Add a field once here and it shows up everywhere — this is the
// anti-tech-debt contract.

import {
  OWNER_VALUES,
  RSVP_VALUES,
  TASK_STATUSES,
  VENDOR_STATUSES,
  VENUE_STATUSES,
  type EntitySlug,
} from "./types";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "date"
  | "boolean"
  | "select"
  | "email"
  | "url";

export interface Option {
  value: string;
  label: string;
}

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: Option[];
  required?: boolean;
  // Numeric fields backed by a nullable column: empty input stores null instead
  // of 0. Leave false for non-nullable columns (e.g. capacity, estCost).
  nullable?: boolean;
  // Optional length cap + regex for string fields (enforced client + server).
  maxLength?: number;
  pattern?: string;
  // Display text for a boolean field's true/false states (default Yes/No).
  trueLabel?: string;
  falseLabel?: string;
  help?: string;
  placeholder?: string;
  // Show this field as a column/primary line in the compact list view.
  inList?: boolean;
}

export interface EntitySchema {
  slug: EntitySlug;
  model: "guest" | "budgetLine" | "task" | "vendor" | "venue";
  singular: string;
  plural: string;
  // Field used as the bold title in cards/rows.
  titleKey: string;
  fields: Field[];
}

const opt = (values: readonly string[]): Option[] =>
  values.map((v) => ({ value: v, label: v }));

// Owner default labels (Timeline overrides these with live partner names).
const ownerDefaultOptions: Option[] = OWNER_VALUES.map((v) => ({
  value: v,
  label: v === "Partner1" ? "Katie" : v === "Partner2" ? "Me" : v,
}));

export const SCHEMAS: Record<EntitySlug, EntitySchema> = {
  guests: {
    slug: "guests",
    model: "guest",
    singular: "Guest",
    plural: "Guests",
    titleKey: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true, inList: true },
      { key: "party", label: "Party / household", type: "text", inList: true },
      {
        key: "side",
        label: "Side",
        type: "select",
        options: [
          { value: "Partner1", label: "Katie" },
          { value: "Partner2", label: "Me" },
          { value: "Both", label: "Both" },
        ],
        inList: true,
      },
      { key: "rsvp", label: "RSVP", type: "select", options: opt(RSVP_VALUES), inList: true },
      { key: "email", label: "Email", type: "email" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  budget: {
    slug: "budget",
    model: "budgetLine",
    singular: "Budget line",
    plural: "Budget",
    titleKey: "item",
    fields: [
      { key: "item", label: "Item", type: "text", required: true, inList: true },
      { key: "category", label: "Category", type: "text", inList: true },
      { key: "estCost", label: "Estimated cost", type: "money", inList: true },
      { key: "actualCost", label: "Actual cost", type: "money", nullable: true, inList: true },
      { key: "paid", label: "Paid", type: "boolean", trueLabel: "Paid", falseLabel: "Unpaid", inList: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  tasks: {
    slug: "tasks",
    model: "task",
    singular: "Task",
    plural: "Timeline",
    titleKey: "title",
    fields: [
      { key: "title", label: "Task", type: "text", required: true, inList: true },
      {
        key: "owner",
        label: "Owner",
        type: "select",
        options: ownerDefaultOptions,
        inList: true,
      },
      { key: "due", label: "Due date", type: "date", inList: true },
      { key: "status", label: "Status", type: "select", options: opt(TASK_STATUSES), inList: true },
      { key: "category", label: "Category", type: "text", inList: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  vendors: {
    slug: "vendors",
    model: "vendor",
    singular: "Vendor",
    plural: "Vendors",
    titleKey: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true, inList: true },
      { key: "category", label: "Category", type: "text", inList: true },
      { key: "status", label: "Status", type: "select", options: opt(VENDOR_STATUSES), inList: true },
      { key: "cost", label: "Cost", type: "money", nullable: true, inList: true },
      { key: "contact", label: "Contact", type: "text" },
      { key: "url", label: "Website", type: "url" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  venues: {
    slug: "venues",
    model: "venue",
    singular: "Venue",
    plural: "Venues",
    titleKey: "name",
    fields: [
      { key: "name", label: "Name", type: "text", required: true, inList: true },
      { key: "location", label: "Location", type: "text", inList: true },
      { key: "status", label: "Status", type: "select", options: opt(VENUE_STATUSES), inList: true },
      { key: "capacity", label: "Capacity", type: "number", inList: true },
      { key: "estCost", label: "Estimated cost", type: "money", inList: true },
      { key: "pricePerHead", label: "Price per head", type: "money", nullable: true },
      { key: "url", label: "Website", type: "url" },
      { key: "contact", label: "Contact", type: "text" },
      { key: "pros", label: "Pros", type: "textarea" },
      { key: "cons", label: "Cons", type: "textarea" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
};

// Coerce an arbitrary request body to only the fields a schema declares, with
// correct types. Empty optional values become null. Used by every write route.
export function sanitize(
  slug: EntitySlug,
  body: Record<string, unknown>,
): Record<string, unknown> {
  const schema = SCHEMAS[slug];
  const out: Record<string, unknown> = {};
  for (const field of schema.fields) {
    if (!(field.key in body)) continue;
    const raw = body[field.key];
    switch (field.type) {
      case "number":
      case "money": {
        // Empty (or non-numeric) → null only for nullable columns, else 0, so we
        // never send null into a non-nullable Int column.
        const fallback = field.nullable ? null : 0;
        if (raw === "" || raw === null || raw === undefined) {
          out[field.key] = fallback;
        } else {
          const n = Number(raw);
          out[field.key] = Number.isFinite(n) ? Math.round(n) : fallback;
        }
        break;
      }
      case "boolean":
        out[field.key] = Boolean(raw);
        break;
      default: {
        const s = raw === null || raw === undefined ? "" : String(raw).trim();
        out[field.key] = s === "" && !field.required ? null : s;
      }
    }
  }
  return out;
}

// Config singleton field schema (Settings page renders from this).
export const CONFIG_FIELDS: Field[] = [
  { key: "date", label: "Wedding date", type: "date", required: true, help: "Drives the countdown." },
  { key: "backupDate", label: "Backup date", type: "date", help: "Optional rain / fallback date." },
  { key: "location", label: "Location", type: "text", help: "Set automatically when you choose a venue." },
  { key: "venue", label: "Venue", type: "text" },
  { key: "guestTarget", label: "Guest target", type: "number" },
  { key: "budgetMin", label: "Budget min", type: "money" },
  { key: "budgetMax", label: "Budget max", type: "money" },
  { key: "partner1Name", label: "Partner 1 name", type: "text", required: true },
  { key: "partner2Name", label: "Partner 2 name", type: "text", required: true },
  { key: "partner1Email", label: "Partner 1 email", type: "email", help: "Digest recipient." },
  { key: "partner2Email", label: "Partner 2 email", type: "email", help: "Digest recipient." },
];

const CONFIG_TYPES: Record<string, FieldType> = Object.fromEntries(
  CONFIG_FIELDS.map((f) => [f.key, f.type]),
);

export function sanitizeConfig(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const type = CONFIG_TYPES[key];
    if (!type) continue;
    if (type === "number" || type === "money") {
      const n = Number(value);
      out[key] = Number.isFinite(n) ? Math.round(n) : 0;
    } else {
      const s = value === null || value === undefined ? "" : String(value).trim();
      // Names are required-non-null; emails/dates may be null.
      const nullable = key !== "partner1Name" && key !== "partner2Name" && key !== "date";
      out[key] = s === "" && nullable ? null : s;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Shared validation — one implementation used by both the client (EntityEditor
// inline field errors) and the server (API routes return 400 { errors }). This
// keeps validation rules in the same single source of truth as the fields.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // HTML date input format

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export interface ValidateOptions {
  // Partial (PATCH) only checks fields present in the body; create checks all.
  partial?: boolean;
}

function validateField(field: Field, raw: unknown): string | null {
  if (field.type === "boolean") return null;

  if (field.type === "number" || field.type === "money") {
    if (raw === "" || raw === null || raw === undefined) {
      return field.required ? `${field.label} is required.` : null;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return `${field.label} must be a number.`;
    if (n < 0) return `${field.label} can't be negative.`;
    return null;
  }

  const s = raw === null || raw === undefined ? "" : String(raw).trim();
  if (s === "") return field.required ? `${field.label} is required.` : null;
  if (field.maxLength && s.length > field.maxLength)
    return `${field.label} must be ${field.maxLength} characters or fewer.`;
  if (field.type === "email" && !EMAIL_RE.test(s)) return "Enter a valid email address.";
  if (field.type === "url" && !URL_RE.test(s)) return "Enter a valid URL (https://…).";
  if (field.type === "date" && !DATE_RE.test(s)) return "Enter a valid date.";
  if (field.pattern && !new RegExp(field.pattern).test(s)) return `${field.label} is invalid.`;
  return null;
}

export function validateFields(
  fields: Field[],
  body: Record<string, unknown>,
  opts: ValidateOptions = {},
): ValidationResult {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const present = field.key in body;
    if (!present) {
      if (!opts.partial && field.required) errors[field.key] = `${field.label} is required.`;
      continue;
    }
    const err = validateField(field, body[field.key]);
    if (err) errors[field.key] = err;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

export function validate(
  slug: EntitySlug,
  body: Record<string, unknown>,
  opts: ValidateOptions = {},
): ValidationResult {
  return validateFields(SCHEMAS[slug].fields, body, opts);
}

export function validateConfig(
  body: Record<string, unknown>,
  opts: ValidateOptions = {},
): ValidationResult {
  return validateFields(CONFIG_FIELDS, body, opts);
}
