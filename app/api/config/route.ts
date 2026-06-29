import { getConfig, repos } from "@/lib/server/sheets";
import { sanitizeConfig, validateConfig } from "@/lib/schemas";
import { HttpError, json, readJson, withErrors } from "@/lib/server/handler";

export const GET = withErrors(async () => {
  const config = await getConfig();
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
  const current = await getConfig();
  const config = await repos.config.update({
    where: { id: current.id as number },
    data: sanitizeConfig(body),
  });
  return json(config);
});
