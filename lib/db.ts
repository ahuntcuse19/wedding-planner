import { PrismaClient } from "@prisma/client";

// Candidate connection-string variables, in priority order. We standardize on
// DATABASE_URL, but Vercel's Postgres / Supabase Storage integration injects
// POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING / POSTGRES_URL instead, so we
// fall back to those. Without this, a deployment that relies on the integration
// fails to connect ("Environment variable not found: DATABASE_URL") and every
// API route 500s.
const URL_VARS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
] as const;

// A value still containing one of these tokens is an unfilled template, not a
// real connection string. Ignore it so a stray placeholder can't shadow a good
// variable — and so the diagnostics below name the real problem.
const PLACEHOLDER = /\[YOUR|USER:PASSWORD|HOST\/DBNAME|<[^>]+>/i;

function resolveDatabaseUrl(): string | undefined {
  for (const name of URL_VARS) {
    const value = process.env[name];
    if (!value) continue;
    if (PLACEHOLDER.test(value)) {
      console.warn(
        `[db] Ignoring ${name}: looks like an unfilled placeholder, not a real connection string.`,
      );
      continue;
    }
    if (process.env.NODE_ENV !== "production") {
      console.info(`[db] Using ${name} for the database connection.`);
    }
    return value;
  }

  // Nothing usable. Log a precise diagnosis (variable NAMES only, never values)
  // so the runtime logs say exactly what the host did and didn't provide,
  // instead of Prisma's opaque "Environment variable not found: DATABASE_URL".
  const present = Object.keys(process.env)
    .filter((k) => /^(DATABASE_URL|POSTGRES_)/.test(k))
    .sort();
  console.error(
    `[db] No usable database connection string. Checked ${URL_VARS.join(", ")}. ` +
      `Connection-related env vars present in this runtime: ${present.length ? present.join(", ") : "(none)"}. ` +
      `Set DATABASE_URL (or POSTGRES_PRISMA_URL) in the deployment environment, then redeploy.`,
  );
  return undefined;
}

// Single Prisma client instance, reused across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Pass the URL explicitly so the runtime connection works regardless of
    // which env var name the host uses; the schema's env("DATABASE_URL") is
    // only needed by the Prisma CLI (migrate/seed).
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
