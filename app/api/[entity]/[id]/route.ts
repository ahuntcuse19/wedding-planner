import { NextResponse } from "next/server";
import { delegateFor, isEntitySlug } from "@/lib/server/entities";
import { sanitize } from "@/lib/schemas";

// Generic update + delete by id.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ entity: string; id: string }> },
) {
  const { entity, id } = await ctx.params;
  const delegate = delegateFor(entity);
  if (!delegate || !isEntitySlug(entity))
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const body = (await req.json()) as Record<string, unknown>;
  const data = sanitize(entity, body);
  const row = await delegate.update({ where: { id: Number(id) }, data });
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ entity: string; id: string }> },
) {
  const { entity, id } = await ctx.params;
  const delegate = delegateFor(entity);
  if (!delegate) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  await delegate.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
