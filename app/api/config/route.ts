import { prisma } from "@/lib/db";
import { sanitizeConfig, validateConfig } from "@/lib/schemas";
import { HttpError, json, readJson, withErrors } from "@/lib/server/handler";

// Config is a singleton (id = 1). Create a default row on first read.
async function getOrCreateConfig() {
  const existing = await prisma.config.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;
  return prisma.config.create({ data: { date: "", location: "", venue: "" } });
}

export const GET = withErrors(async () => {
  const config = await getOrCreateConfig();
  return json(config);
});

export const PATCH = withErrors(async (req: Request) => {
  const body = await readJson(req);
  const result = validateConfig(body, { partial: true });
  if (!result.ok)
    throw new HttpError(400, "Validation failed.", {
      error: "Validation failed.",
      errors: result.errors,
    });
  const current = await getOrCreateConfig();
  const config = await prisma.config.update({
    where: { id: current.id },
    data: sanitizeConfig(body),
  });
  return json(config);
});
