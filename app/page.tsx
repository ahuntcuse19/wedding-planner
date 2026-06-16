"use client";

import Link from "next/link";
import { C, F } from "@/lib/theme";
import { Badge, Card, PageTitle, Stat } from "@/components/primitives";
import { useConfig } from "@/hooks/useConfig";
import { useEntity } from "@/hooks/useEntity";
import { ownerLabel, type BudgetLine, type Guest, type Task, type Vendor } from "@/lib/types";

const money = (n: number) => "$" + n.toLocaleString("en-US");

function daysToGo(dateISO?: string | null): number | null {
  if (!dateISO) return null;
  const t = new Date(dateISO + "T00:00:00");
  if (Number.isNaN(t.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((t.getTime() - today.getTime()) / 86_400_000);
}

export default function Dashboard() {
  const { config } = useConfig();
  const { data: guests } = useEntity<Guest>("guests");
  const { data: budget } = useEntity<BudgetLine>("budget");
  const { data: tasks } = useEntity<Task>("tasks");
  const { data: vendors } = useEntity<Vendor>("vendors");

  const days = daysToGo(config?.date);
  const rsvpYes = guests.filter((g) => g.rsvp === "Yes").length;
  const rsvpPending = guests.filter((g) => g.rsvp === "Pending").length;
  const budgetTotal = budget.reduce((s, b) => s + (b.actualCost ?? b.estCost ?? 0), 0);
  const over = (config?.budgetMax ?? 0) > 0 && budgetTotal > (config?.budgetMax ?? 0);
  const openTasks = tasks.filter((t) => t.status !== "Done");

  const ownerOrder = ["Partner1", "Partner2", "Both", "Coordinator", "Vendor"];
  const tasksByOwner = ownerOrder
    .map((o) => ({ owner: o, label: ownerLabel(o, config), count: openTasks.filter((t) => t.owner === o).length }))
    .filter((g) => g.count > 0);

  const vendorCounts: Record<string, number> = {};
  for (const v of vendors) vendorCounts[v.status] = (vendorCounts[v.status] ?? 0) + 1;

  const where = [config?.venue, config?.location].filter(Boolean).join(", ");

  return (
    <div>
      <PageTitle title="Dashboard" subtitle="Everything at a glance." />

      <Card style={{ marginBottom: 20, textAlign: "center", background: C.surface }}>
        {days === null ? (
          <div>
            <div style={{ font: `600 28px ${F.display}`, color: C.ink }}>Set your wedding date</div>
            <Link href="/settings" style={{ color: C.primary, fontWeight: 600 }}>Go to Settings →</Link>
          </div>
        ) : (
          <>
            <div style={{ font: `700 52px ${F.display}`, color: C.primary, lineHeight: 1 }}>
              {days >= 0 ? `${days} days to go` : `${Math.abs(days)} days ago`}
            </div>
            <div style={{ color: C.inkSoft, marginTop: 8, fontSize: 15 }}>
              {config?.date}
              {config?.backupDate ? ` · backup ${config.backupDate}` : ""}
              {where ? ` · ${where}` : ""}
            </div>
          </>
        )}
      </Card>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", marginBottom: 20 }}>
        <Stat label="Guests confirmed" value={`${rsvpYes} / ${config?.guestTarget ?? "—"}`} hint={`${rsvpPending} pending`} />
        <Stat
          label="Budget"
          value={money(budgetTotal)}
          tone={over ? "danger" : "default"}
          hint={config ? `of ${money(config.budgetMin)}–${money(config.budgetMax)}${over ? " · over!" : ""}` : undefined}
        />
        <Stat label="Open tasks" value={openTasks.length} hint={`${tasks.length - openTasks.length} done`} />
        <Stat label="Vendors booked" value={vendorCounts["Booked"] ?? 0} hint={`${vendors.length} total`} />
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <Card>
          <div style={{ font: `600 18px ${F.display}`, color: C.ink, marginBottom: 12 }}>Open tasks by owner</div>
          {tasksByOwner.length === 0 ? (
            <div style={{ color: C.inkSoft }}>No open tasks 🎉</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {tasksByOwner.map((g) => (
                <div key={g.owner} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span style={{ color: C.ink }}>{g.label}</span>
                  <span style={{ color: C.inkSoft, fontWeight: 600 }}>{g.count}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/timeline" style={{ color: C.primary, fontWeight: 600, fontSize: 13, display: "inline-block", marginTop: 12 }}>View timeline →</Link>
        </Card>

        <Card>
          <div style={{ font: `600 18px ${F.display}`, color: C.ink, marginBottom: 12 }}>Vendors</div>
          {Object.keys(vendorCounts).length === 0 ? (
            <div style={{ color: C.inkSoft }}>No vendors yet.</div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(vendorCounts).map(([s, n]) => (
                <div key={s} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Badge value={s} />
                  <span style={{ color: C.inkSoft, fontSize: 13 }}>{n}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/vendors" style={{ color: C.primary, fontWeight: 600, fontSize: 13, display: "inline-block", marginTop: 12 }}>View vendors →</Link>
        </Card>
      </div>
    </div>
  );
}
