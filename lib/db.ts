import { PrismaClient } from "@prisma/client";

// Resolve the Postgres connection string from whichever variable the host
// provides. We standardize on DATABASE_URL, but Vercel's Postgres Storage
// integration injects POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING instead,
// so fall back to those. Without this, a deployment that relies on the Vercel
// integration fails to connect ("Environment variable not found: DATABASE_URL")
// and every API route 500s.
function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    undefined
  );
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
