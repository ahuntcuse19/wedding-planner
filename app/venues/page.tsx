"use client";

import { useEffect, useState } from "react";
import { C, F, statusStyle } from "@/lib/theme";
import { Badge, Button, Card, Empty, ErrorState, PageTitle, SkeletonList } from "@/components/primitives";
import Modal from "@/components/Modal";
import EntityEditor from "@/components/EntityEditor";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import { SCHEMAS } from "@/lib/schemas";
import { VENUE_STATUSES, type Venue } from "@/lib/types";
import { useEntity } from "@/hooks/useEntity";
import { useConfig } from "@/hooks/useConfig";

const money = (n: number) => "$" + n.toLocaleString("en-US");

interface SearchResult {
  name: string;
  location: string;
  lat: number | null;
  lng: number | null;
  url: string;
  sourceUrl: string;
  source: string;
}

export default function VenuesPage() {
  const schema = SCHEMAS.venues;
  const { data, isLoading, error, create, update, remove, refresh } = useEntity<Venue>("venues");
  const { config, refresh: refreshConfig } = useConfig();
  const toast = useToast();
  const confirm = useConfirm();
  const guestTarget = config?.guestTarget ?? 0;

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Venue | null>(null);

  // Optional search state (only used when the env-gated API reports enabled).
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    // Discover whether live search is configured; hide the box if not.
    fetch("/api/venues/search")
      .then((r) => r.json())
      .then((d) => setSearchEnabled(!!d.enabled))
      .catch(() => setSearchEnabled(false));
  }, []);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    try {
      const r = await fetch(`/api/venues/search?q=${encodeURIComponent(query)}`);
      const d = await r.json();
      if (!r.ok) setSearchError(d.error || "Search failed");
      else setResults(d.results ?? []);
    } catch {
      setSearchError("Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function saveResult(res: SearchResult) {
    try {
      await create({
        name: res.name,
        location: res.location,
        lat: res.lat,
        lng: res.lng,
        url: res.url,
        status: "Considering",
        source: res.source,
      } as Partial<Venue>);
      toast.success(`Saved “${res.name}” to your venues.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Couldn't save “${res.name}”.`);
    }
  }

  async function setAsVenue(v: Venue) {
    try {
      const r = await fetch("/api/venues/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: v.id }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      await refresh();
      await refreshConfig();
      if (d.capacityWarning) toast.info(`${v.name} set as your venue. ⚠ ${d.capacityWarning}`);
      else toast.success(`${v.name} set as your venue.`);
    } catch {
      toast.error(`Couldn't set ${v.name} as your venue. Please try again.`);
    }
  }

  const venues = data.filter((v) => statusFilter === "all" || v.status === statusFilter);

  return (
    <div>
      <PageTitle title="Venues" subtitle="Explore, compare, and choose where you'll celebrate." />

      {/* Optional, env-gated live search. Hidden entirely without an API key. */}
      {searchEnabled && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ font: "600 13px system-ui", textTransform: "uppercase", letterSpacing: ".05em", color: C.inkSoft, marginBottom: 10 }}>
            Search real venues
          </div>
          <form onSubmit={runSearch} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. barn venue near Hudson Valley"
              style={{ flex: "1 1 240px", padding: "9px 11px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14 }}
            />
            <Button type="submit" disabled={searching}>{searching ? "Searching…" : "Search"}</Button>
          </form>
          {searchError && <div style={{ color: C.danger, fontSize: 13, marginTop: 8 }}>{searchError}</div>}
          {results.length > 0 && (
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {results.map((res, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: C.ink }}>{res.name}</div>
                    <div style={{ color: C.inkSoft, fontSize: 13 }}>{res.location}</div>
                    {res.sourceUrl && (
                      <a href={res.sourceUrl} target="_blank" rel="noreferrer" style={{ color: C.primary, fontSize: 12 }}>
                        Source: Google Maps ↗
                      </a>
                    )}
                  </div>
                  <Button variant="subtle" onClick={() => saveResult(res)}>Save</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Filter + manual add */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        {["all", ...VENUE_STATUSES].map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-pressed={active}
              style={{ padding: "7px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? C.primary : C.border}`, background: active ? C.primary : C.surface, color: active ? "#fff" : C.inkSoft }}
            >
              {s === "all" ? "All" : s}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <Button onClick={() => setAdding(true)}>+ Add venue</Button>
      </div>

      {error ? (
        <ErrorState message="Couldn't load venues." onRetry={() => refresh()} />
      ) : isLoading ? (
        <SkeletonList />
      ) : venues.length === 0 ? (
        <Empty>No venues yet. Add one manually{searchEnabled ? " or search above" : ""}.</Empty>
      ) : (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
          {venues.map((v) => {
            const isChosen = config?.chosenVenueId === v.id;
            const tooSmall = v.capacity > 0 && guestTarget > 0 && v.capacity < guestTarget;
            return (
              <Card key={v.id} style={{ borderColor: isChosen ? C.primary : C.border, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
                  <div style={{ font: `600 19px ${F.display}`, color: C.ink }}>{v.name}</div>
                  <Badge value={v.status} />
                </div>
                {v.location && <div style={{ color: C.inkSoft, fontSize: 14 }}>{v.location}</div>}

                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, marginTop: 2 }}>
                  <span><span style={{ color: C.inkSoft }}>Capacity: </span>{v.capacity || "—"}</span>
                  <span><span style={{ color: C.inkSoft }}>Est. cost: </span>{v.estCost ? money(v.estCost) : "—"}</span>
                  {v.pricePerHead ? <span><span style={{ color: C.inkSoft }}>/head: </span>{money(v.pricePerHead)}</span> : null}
                </div>

                {tooSmall && (
                  <div style={{ background: statusStyle("Declined").bg, color: C.danger, fontSize: 12.5, fontWeight: 600, padding: "6px 10px", borderRadius: 8 }}>
                    ⚠ Capacity {v.capacity} is below your guest target ({guestTarget}).
                  </div>
                )}

                {v.pros && <div style={{ fontSize: 13 }}><span style={{ color: C.accent, fontWeight: 600 }}>+ </span>{v.pros}</div>}
                {v.cons && <div style={{ fontSize: 13 }}><span style={{ color: C.danger, fontWeight: 600 }}>− </span>{v.cons}</div>}
                {v.url && <a href={v.url} target="_blank" rel="noreferrer" style={{ color: C.primary, fontSize: 13 }}>Website ↗</a>}
                {v.source === "google_places" && <div style={{ color: C.inkSoft, fontSize: 11 }}>From Google Places</div>}

                <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8, flexWrap: "wrap" }}>
                  {isChosen ? (
                    <span style={{ color: C.primary, fontWeight: 700, fontSize: 13, alignSelf: "center" }}>★ Your venue</span>
                  ) : (
                    <Button variant="subtle" onClick={() => setAsVenue(v)}>Set as our venue</Button>
                  )}
                  <div style={{ flex: 1 }} />
                  <Button variant="ghost" onClick={() => setEditing(v)}>Edit</Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Delete venue?",
                        body: `This permanently removes “${v.name}”. This can't be undone.`,
                        confirmLabel: "Delete",
                        danger: true,
                      });
                      if (!ok) return;
                      try {
                        await remove(v.id);
                        toast.success("Venue deleted.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Couldn't delete this venue.");
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add venue">
        <EntityEditor
          fields={schema.fields}
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => { await create(values as Partial<Venue>); setAdding(false); toast.success("Venue added."); }}
        />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit venue">
        {editing && (
          <EntityEditor
            fields={schema.fields}
            initial={editing as unknown as Record<string, unknown>}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => { await update(editing.id, values as Partial<Venue>); setEditing(null); toast.success("Venue updated."); }}
          />
        )}
      </Modal>
    </div>
  );
}
