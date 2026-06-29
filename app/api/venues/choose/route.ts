import { getConfig, repos } from "@/lib/server/sheets";
import { HttpError, json, withErrors } from "@/lib/server/handler";
import type { Config, Venue } from "@/lib/types";

// "Set as our venue": copy a venue's name/location into Config, mark it Booked,
// and return a capacity warning if it can't hold the guest target. Never emails.
export const POST = withErrors(async (req: Request) => {
  const { venueId } = (await req.json().catch(() => ({}))) as { venueId?: number };
  if (!venueId) throw new HttpError(400, "venueId required.");

  const venue = (await repos.venue.findById(Number(venueId))) as Venue | null;
  if (!venue) throw new HttpError(404, "Venue not found.");

  const config = (await getConfig()) as unknown as Config;

  // Sheets has no transactions, so apply the writes in the order that keeps the
  // data sensible if one fails: demote any previously-Booked venue first, then
  // promote the chosen one, then point Config at it. Only one venue ever reads
  // as Booked.
  const venues = (await repos.venue.findMany()) as unknown as Venue[];
  for (const v of venues) {
    if (v.status === "Booked" && v.id !== venue.id) {
      await repos.venue.update({ where: { id: v.id }, data: { status: "Toured" } });
    }
  }
  await repos.venue.update({ where: { id: venue.id }, data: { status: "Booked" } });

  const updatedConfig = (await repos.config.update({
    where: { id: config.id },
    // Store the id (stable link) plus name/location for the header display.
    data: { venue: venue.name, location: venue.location, chosenVenueId: venue.id },
  })) as unknown as Config;

  const capacityWarning =
    venue.capacity > 0 && venue.capacity < updatedConfig.guestTarget
      ? `Capacity (${venue.capacity}) is below your guest target (${updatedConfig.guestTarget}).`
      : null;

  return json({ config: updatedConfig, capacityWarning });
});
