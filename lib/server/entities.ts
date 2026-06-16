import { prisma } from "@/lib/db";
import { SCHEMAS } from "@/lib/schemas";
import type { EntitySlug } from "@/lib/types";

// Map a URL slug to its Prisma delegate. Returns null for unknown slugs so the
// generic route can 404 cleanly. This is the only place slugs touch the DB.
export function delegateFor(slug: string) {
  if (!(slug in SCHEMAS)) return null;
  const model = SCHEMAS[slug as EntitySlug].model;
  // Prisma delegates are keyed by camelCase model name.
  return (prisma as unknown as Record<string, any>)[model] ?? null;
}

export function isEntitySlug(slug: string): slug is EntitySlug {
  return slug in SCHEMAS;
}
