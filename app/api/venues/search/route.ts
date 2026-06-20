import { NextResponse } from "next/server";

// Optional live venue search via Google Places API (New) "Text Search".
// Gated by env: if disabled or unkeyed, returns { enabled: false } and the UI
// hides search. Results come ONLY from the API — venues are never fabricated.

function searchEnabled() {
  return (
    process.env.VENUE_SEARCH_ENABLED === "true" &&
    !!process.env.PLACES_API_KEY
  );
}

export async function GET(req: Request) {
  if (!searchEnabled()) {
    return NextResponse.json({ enabled: false, results: [] });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ enabled: true, results: [] });

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.PLACES_API_KEY as string,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.location,places.websiteUri,places.googleMapsUri,places.id",
      },
      body: JSON.stringify({ textQuery: `${q} wedding venue`, maxResultCount: 10 }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { enabled: true, error: "Places API error", detail },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        websiteUri?: string;
        googleMapsUri?: string;
      }>;
    };

    const results = (data.places ?? []).map((p) => ({
      name: p.displayName?.text ?? "Unknown",
      location: p.formattedAddress ?? "",
      lat: p.location?.latitude ?? null,
      lng: p.location?.longitude ?? null,
      url: p.websiteUri ?? p.googleMapsUri ?? "",
      sourceUrl: p.googleMapsUri ?? "",
      source: "google_places" as const,
    }));

    return NextResponse.json({ enabled: true, results });
  } catch (err) {
    return NextResponse.json(
      { enabled: true, error: "Search failed", detail: String(err) },
      { status: 502 },
    );
  }
}
