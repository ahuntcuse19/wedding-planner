import { prisma } from "@/lib/db";
import { HttpError, json, withErrors } from "@/lib/server/handler";

// "Set as our venue": copy a venue's name/location into Config, mark it Booked,
// and return a capacity warning if it can't hold the guest target. Never emails.
export const POST = withErrors(async (req: Request) => {
  const { venueId } = (await req.json().catch(() => ({}))) as { venueId?: number };
  if (!venueId) throw new HttpError(400, "venueId required.");

  const venue = await prisma.venue.findUnique({ where: { id: Number(venueId) } });
  if (!venue) throw new HttpError(404, "Venue not found.");

  const config =
    (await prisma.config.findFirst({ orderBy: { id: "asc" } })) ??
    (await prisma.config.create({ data: { date: "", location: "", venue: "" } }));

  // All three writes succeed or none do — never leave a half-applied "Booked"
  // state (config updated but venue not promoted, or two venues Booked).
  const [updatedConfig] = await prisma.$transaction([
    prisma.config.update({
      where: { id: config.id },
      // Store the id (stable link) plus name/location for the header display.
      data: { venue: venue.name, location: venue.location, chosenVenueId: venue.id },
    }),
    // Demote any previously-Booked venue, then promote the chosen one — only one
    // venue should ever read as Booked.
    prisma.venue.updateMany({
      where: { status: "Booked", id: { not: venue.id } },
      data: { status: "Toured" },
    }),
    prisma.venue.update({ where: { id: venue.id }, data: { status: "Booked" } }),
  ]);

  const capacityWarning =
    venue.capacity > 0 && venue.capacity < updatedConfig.guestTarget
      ? `Capacity (${venue.capacity}) is below your guest target (${updatedConfig.guestTarget}).`
      : null;

  return json({ config: updatedConfig, capacityWarning });
});
