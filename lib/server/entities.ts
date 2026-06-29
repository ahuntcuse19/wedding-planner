import { repos } from "@/lib/server/sheets";
import { SCHEMAS } from "@/lib/schemas";
import type { EntitySlug } from "@/lib/types";

// The slice of a data-layer repository the generic routes actually use.
export interface EntityDelegate {
  findMany: (args?: { orderBy?: { id: "asc" | "desc" } }) => Promise<unknown[]>;
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  update: (args: { where: { id: number }; data: Record<string, unknown> }) => Promise<unknown>;
  delete: (args: { where: { id: number } }) => Promise<unknown>;
}

// Map a URL slug to its sheet-backed repository. Returns null for unknown slugs
// so the generic route can 404 cleanly. This is the only place slugs touch the
// data layer.
export function delegateFor(slug: string): EntityDelegate | null {
  if (!(slug in SCHEMAS)) return null;
  const model = SCHEMAS[slug as EntitySlug].model;
  // Repositories are keyed by the same camelCase model name the schema uses.
  return (repos as unknown as Record<string, EntityDelegate>)[model] ?? null;
}

export function isEntitySlug(slug: string): slug is EntitySlug {
  return slug in SCHEMAS;
}
