import { delegateFor, isEntitySlug } from "@/lib/server/entities";
import { sanitize, validate } from "@/lib/schemas";
import { HttpError, json, readJson, withErrors } from "@/lib/server/handler";

// Generic list + create for every entity. One handler, no per-entity fetch code.
export const GET = withErrors(async (
  _req: Request,
  ctx: { params: Promise<{ entity: string }> },
) => {
  const { entity } = await ctx.params;
  const delegate = delegateFor(entity);
  if (!delegate) throw new HttpError(404, "Unknown entity.");
  const rows = await delegate.findMany({ orderBy: { id: "asc" } });
  return json(rows);
});

export const POST = withErrors(async (
  req: Request,
  ctx: { params: Promise<{ entity: string }> },
) => {
  const { entity } = await ctx.params;
  const delegate = delegateFor(entity);
  if (!delegate || !isEntitySlug(entity)) throw new HttpError(404, "Unknown entity.");
  const body = await readJson(req);
  const result = validate(entity, body);
  if (!result.ok)
    throw new HttpError(400, "Validation failed.", {
      error: "Validation failed.",
      errors: result.errors,
    });
  const row = await delegate.create({ data: sanitize(entity, body) });
  return json(row, 201);
});
