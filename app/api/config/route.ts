import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeConfig } from "@/lib/schemas";

// Config is a singleton (id = 1). Create a default row on first read.
async function getOrCreateConfig() {
  const existing = await prisma.config.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;
  return prisma.config.create({
    data: { date: "", location: "", venue: "" },
  });
}

export async function GET() {
  const config = await getOrCreateConfig();
  return NextResponse.json(config);
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const data = sanitizeConfig(body);
  const current = await getOrCreateConfig();
  const config = await prisma.config.update({ where: { id: current.id }, data });
  return NextResponse.json(config);
}
