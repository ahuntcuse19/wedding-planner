// Plain client-safe types mirroring the Prisma models. Components and hooks use
// these so the client never imports the Prisma runtime.

export interface Config {
  id: number;
  date: string;
  backupDate: string | null;
  location: string;
  venue: string;
  guestTarget: number;
  budgetMin: number;
  budgetMax: number;
  partner1Name: string;
  partner2Name: string;
  partner1Email: string | null;
  partner2Email: string | null;
  chosenVenueId: number | null;
  updatedAt: string;
}

export interface BudgetLine {
  id: number;
  category: string;
  item: string;
  estCost: number;
  actualCost: number | null;
  paid: boolean;
  notes: string;
  createdAt: string;
}

export interface Guest {
  id: number;
  name: string;
  party: string;
  side: string;
  rsvp: string;
  email: string | null;
  notes: string;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  owner: string;
  due: string | null;
  status: string;
  category: string;
  notes: string;
  createdAt: string;
}

export interface Vendor {
  id: number;
  name: string;
  category: string;
  status: string;
  cost: number | null;
  contact: string;
  url: string;
  notes: string;
  createdAt: string;
}

export interface Venue {
  id: number;
  name: string;
  location: string;
  lat: number | null;
  lng: number | null;
  capacity: number;
  estCost: number;
  pricePerHead: number | null;
  status: string;
  url: string;
  contact: string;
  pros: string;
  cons: string;
  notes: string;
  source: string;
  createdAt: string;
}

export interface EmailLogEntry {
  id: number;
  sentAt: string;
  type: string;
  recipients: string;
  subject: string;
  status: string;
  error: string | null;
  snapshot: string;
}

// Entity slugs handled by the generic data layer (Config is a separate singleton).
export type EntitySlug = "guests" | "budget" | "tasks" | "vendors" | "venues";

export const OWNER_VALUES = [
  "Partner1",
  "Partner2",
  "Both",
  "Coordinator",
  "Vendor",
] as const;
export type Owner = (typeof OWNER_VALUES)[number];

export const VENUE_STATUSES = [
  "Considering",
  "Shortlist",
  "Toured",
  "Booked",
] as const;
export const VENDOR_STATUSES = [
  "Researching",
  "Contacted",
  "Booked",
  "Declined",
] as const;
export const TASK_STATUSES = ["Todo", "Doing", "Done"] as const;
export const RSVP_VALUES = ["Pending", "Yes", "No", "Maybe"] as const;

// Resolve an owner sentinel to a display label using current partner names.
// Accepts any object carrying the partner names (client Config or Prisma row).
type PartnerNames = { partner1Name?: string | null; partner2Name?: string | null };

export function ownerLabel(value: string, config?: PartnerNames | null): string {
  if (value === "Partner1") return config?.partner1Name || "Katie";
  if (value === "Partner2") return config?.partner2Name || "Me";
  return value;
}

// Owner select options with labels resolved from config (used by Timeline + filters).
export function ownerOptions(config?: PartnerNames | null) {
  return OWNER_VALUES.map((v) => ({ value: v, label: ownerLabel(v, config) }));
}
