import { NextResponse } from "next/server";
import { delegateFor, isEntitySlug } from "@/lib/server/entities";
import { sanitize } from "@/lib/schemas";

// Generic list + create for every entity. One handler, no per-entity fetch code.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ entity: string }> },
) {
  const { entity } = await ctx.params;
  const delegate = delegateFor(entity);
  if (!delegate) return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const rows = await delegate.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rows);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ entity: string }> },
) {
  const { entity } = await ctx.params;
  const delegate = delegateFor(entity);
  if (!delegate || !isEntitySlug(entity))
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  const body = (await req.json()) as Record<string, unknown>;
  const data = sanitize(entity, body);
  const row = await delegate.create({ data });
  return NextResponse.json(row, { status: 201 });
}
