import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// "Set as our venue": copy a venue's name/location into Config, mark it Booked,
// and return a capacity warning if it can't hold the guest target. Never emails.
export async function POST(req: Request) {
  const { venueId } = (await req.json()) as { venueId?: number };
  if (!venueId) return NextResponse.json({ error: "venueId required" }, { status: 400 });

  const venue = await prisma.venue.findUnique({ where: { id: Number(venueId) } });
  if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  const config =
    (await prisma.config.findFirst({ orderBy: { id: "asc" } })) ??
    (await prisma.config.create({ data: { date: "", location: "", venue: "" } }));

  const updatedConfig = await prisma.config.update({
    where: { id: config.id },
    data: { venue: venue.name, location: venue.location },
  });

  // Demote any previously-Booked venue, then promote the chosen one — only one
  // venue should ever read as Booked.
  await prisma.venue.updateMany({
    where: { status: "Booked", id: { not: venue.id } },
    data: { status: "Toured" },
  });
  await prisma.venue.update({ where: { id: venue.id }, data: { status: "Booked" } });

  const capacityWarning =
    venue.capacity > 0 && venue.capacity < updatedConfig.guestTarget
      ? `Capacity (${venue.capacity}) is below your guest target (${updatedConfig.guestTarget}).`
      : null;

  return NextResponse.json({ config: updatedConfig, capacityWarning });
}
