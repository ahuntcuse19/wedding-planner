import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer auto-loads .env. Load it with Node 22's built-in helper
// so DATABASE_URL is available to the CLI (migrate/seed/studio).
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env is optional in some environments (e.g. CI sets vars directly).
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
});
