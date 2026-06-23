import { delegateFor, isEntitySlug } from "@/lib/server/entities";
import { sanitize, validate } from "@/lib/schemas";
import { HttpError, json, parseId, readJson, withErrors } from "@/lib/server/handler";

// Generic update + delete by id.
export const PATCH = withErrors(async (
  req: Request,
  ctx: { params: Promise<{ entity: string; id: string }> },
) => {
  const { entity, id } = await ctx.params;
  const delegate = delegateFor(entity);
  if (!delegate || !isEntitySlug(entity)) throw new HttpError(404, "Unknown entity.");
  const numId = parseId(id);
  const body = await readJson(req);
  const result = validate(entity, body, { partial: true });
  if (!result.ok)
    throw new HttpError(400, "Validation failed.", {
      error: "Validation failed.",
      errors: result.errors,
    });
  const row = await delegate.update({ where: { id: numId }, data: sanitize(entity, body) });
  return json(row);
});

export const DELETE = withErrors(async (
  _req: Request,
  ctx: { params: Promise<{ entity: string; id: string }> },
) => {
  const { entity, id } = await ctx.params;
  const delegate = delegateFor(entity);
  if (!delegate) throw new HttpError(404, "Unknown entity.");
  const numId = parseId(id);
  // P2025 (missing row) → 404 via withErrors, instead of a silent { ok: true }.
  await delegate.delete({ where: { id: numId } });
  return json({ ok: true });
});
