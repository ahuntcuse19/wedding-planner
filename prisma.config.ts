import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma no longer auto-loads .env when a config file is present. Load it with
// Node 22's built-in helper so the POSTGRES_* connection vars are available to
// the CLI locally (migrate/seed/studio). On hosts like Vercel there's no .env
// file — env vars are injected into the process directly — so the failure is ignored.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env is optional in some environments (e.g. CI / Vercel set vars directly).
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
});
