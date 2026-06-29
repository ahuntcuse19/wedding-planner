import { readConfig, repos } from "@/lib/server/sheets";
import { C } from "@/lib/theme";
import { ownerLabel } from "@/lib/types";
import type { BudgetLine, Config, Guest, Task, Vendor } from "@/lib/types";

// Builds the weekly/manual digest from the database and renders it to HTML.
// Pure data in, HTML out — no email sending here (see api/digest/send).

export interface DigestData {
  generatedAt: string;
  weddingDate: string;
  backupDate: string | null;
  daysToGo: number | null;
  venue: string;
  location: string;
  partner1Name: string;
  partner2Name: string;
  guestTarget: number;
  rsvpYes: number;
  rsvpPending: number;
  guestTotal: number;
  budgetMin: number;
  budgetMax: number;
  budgetTotal: number;
  budgetOver: boolean;
  tasksByOwner: { owner: string; label: string; tasks: { title: string; due: string | null }[] }[];
  openTaskCount: number;
  vendorCounts: Record<string, number>;
  bookedVenue: string | null;
}

export interface Snapshot {
  daysToGo: number | null;
  rsvpYes: number;
  guestTotal: number;
  budgetTotal: number;
  openTaskCount: number;
  bookedVendors: number;
}

function daysBetween(fromISO: string): number | null {
  if (!fromISO) return null;
  const target = new Date(fromISO + "T00:00:00");
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export async function buildDigestData(): Promise<DigestData> {
  const [config, guests, budget, tasks, vendors] = (await Promise.all([
    readConfig(),
    repos.guest.findMany(),
    repos.budgetLine.findMany(),
    repos.task.findMany(),
    repos.vendor.findMany(),
  ])) as unknown as [Config | null, Guest[], BudgetLine[], Task[], Vendor[]];

  const cfg = config ?? {
    date: "",
    backupDate: null,
    location: "",
    venue: "",
    guestTarget: 0,
    budgetMin: 0,
    budgetMax: 0,
    partner1Name: "Katie",
    partner2Name: "Me",
  };

  const rsvpYes = guests.filter((g) => g.rsvp === "Yes").length;
  const rsvpPending = guests.filter((g) => g.rsvp === "Pending").length;
  const budgetTotal = budget.reduce((sum, b) => sum + (b.actualCost ?? b.estCost ?? 0), 0);

  const openTasks = tasks.filter((t) => t.status !== "Done");
  const ownerOrder = ["Partner1", "Partner2", "Both", "Coordinator", "Vendor"];
  const tasksByOwner = ownerOrder
    .map((owner) => ({
      owner,
      label: ownerLabel(owner, cfg),
      tasks: openTasks
        .filter((t) => t.owner === owner)
        .map((t) => ({ title: t.title, due: t.due })),
    }))
    .filter((group) => group.tasks.length > 0);

  const vendorCounts: Record<string, number> = {};
  for (const v of vendors) vendorCounts[v.status] = (vendorCounts[v.status] ?? 0) + 1;

  return {
    generatedAt: new Date().toISOString(),
    weddingDate: cfg.date,
    backupDate: cfg.backupDate,
    daysToGo: daysBetween(cfg.date),
    venue: cfg.venue,
    location: cfg.location,
    partner1Name: cfg.partner1Name,
    partner2Name: cfg.partner2Name,
    guestTarget: cfg.guestTarget,
    rsvpYes,
    rsvpPending,
    guestTotal: guests.length,
    budgetMin: cfg.budgetMin,
    budgetMax: cfg.budgetMax,
    budgetTotal,
    budgetOver: cfg.budgetMax > 0 && budgetTotal > cfg.budgetMax,
    tasksByOwner,
    openTaskCount: openTasks.length,
    vendorCounts,
    bookedVenue: cfg.venue || null,
  };
}

export function snapshotOf(d: DigestData): Snapshot {
  return {
    daysToGo: d.daysToGo,
    rsvpYes: d.rsvpYes,
    guestTotal: d.guestTotal,
    budgetTotal: d.budgetTotal,
    openTaskCount: d.openTaskCount,
    bookedVendors: d.vendorCounts["Booked"] ?? 0,
  };
}

// Human-readable diffs vs the previous digest snapshot.
export function changesSince(prev: Snapshot | null, now: Snapshot): string[] {
  if (!prev) return ["First digest — welcome!"];
  const out: string[] = [];
  const delta = (label: string, a: number, b: number, unit = "") => {
    if (a !== b) {
      const sign = b > a ? "+" : "";
      out.push(`${label}: ${a}${unit} → ${b}${unit} (${sign}${b - a}${unit})`);
    }
  };
  delta("RSVPs (yes)", prev.rsvpYes, now.rsvpYes);
  delta("Guests on list", prev.guestTotal, now.guestTotal);
  delta("Budget total", prev.budgetTotal, now.budgetTotal);
  delta("Open tasks", prev.openTaskCount, now.openTaskCount);
  delta("Booked vendors", prev.bookedVendors, now.bookedVendors);
  return out.length ? out : ["No changes since the last digest."];
}

const money = (n: number) => "$" + n.toLocaleString("en-US");

export function renderDigestHtml(d: DigestData, changes: string[]): string {
  const card = (inner: string) =>
    `<div style="background:${C.surface};border:1px solid ${C.border};border-radius:14px;padding:18px 20px;margin:0 0 16px">${inner}</div>`;
  const h = (t: string) =>
    `<div style="font:600 13px system-ui;letter-spacing:.04em;text-transform:uppercase;color:${C.inkSoft};margin:0 0 10px">${t}</div>`;

  const countdown = d.daysToGo === null
    ? `<div style="font:700 26px Georgia,serif;color:${C.ink}">Set your date</div>`
    : `<div style="font:700 34px Georgia,serif;color:${C.primary}">${d.daysToGo} days to go</div>
       <div style="color:${C.inkSoft};margin-top:4px">${d.weddingDate}${d.backupDate ? ` · backup ${d.backupDate}` : ""}${d.venue ? ` · ${d.venue}` : ""}${d.location ? `, ${d.location}` : ""}</div>`;

  const budgetLine = `${money(d.budgetTotal)} of ${money(d.budgetMin)}–${money(d.budgetMax)}` +
    (d.budgetOver
      ? ` <span style="color:${C.danger};font-weight:600">(over by ${money(d.budgetTotal - d.budgetMax)})</span>`
      : "");

  const tasks = d.tasksByOwner.length
    ? d.tasksByOwner
        .map(
          (g) =>
            `<div style="margin:0 0 10px"><div style="font-weight:600;color:${C.ink}">${g.label} (${g.tasks.length})</div>` +
            `<ul style="margin:4px 0 0;padding-left:18px;color:${C.inkSoft}">` +
            g.tasks.map((t) => `<li>${t.title}${t.due ? ` — <em>due ${t.due}</em>` : ""}</li>`).join("") +
            `</ul></div>`,
        )
        .join("")
    : `<div style="color:${C.inkSoft}">No open tasks 🎉</div>`;

  const vendors = Object.keys(d.vendorCounts).length
    ? Object.entries(d.vendorCounts)
        .map(([s, n]) => `${s}: ${n}`)
        .join(" · ")
    : "No vendors yet";

  return `<!doctype html><html><body style="margin:0;background:${C.bg};padding:24px;font-family:system-ui,Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto">
    <div style="font:700 24px Georgia,serif;color:${C.ink};margin:0 0 4px">Wedding planning digest</div>
    <div style="color:${C.inkSoft};margin:0 0 20px">${d.partner1Name} &amp; ${d.partner2Name}</div>
    ${card(countdown)}
    ${card(`${h("Guests")}<div style="color:${C.ink};font-size:18px">${d.rsvpYes} confirmed · ${d.rsvpPending} pending · target ${d.guestTarget}</div>`)}
    ${card(`${h("Budget")}<div style="color:${C.ink};font-size:18px">${budgetLine}</div>`)}
    ${card(`${h("Open tasks (" + d.openTaskCount + ")")}${tasks}`)}
    ${card(`${h("Vendors")}<div style="color:${C.ink}">${vendors}</div>`)}
    ${card(`${h("Changed since last digest")}<ul style="margin:0;padding-left:18px;color:${C.inkSoft}">${changes.map((c) => `<li>${c}</li>`).join("")}</ul>`)}
    <div style="color:${C.inkSoft};font-size:12px;text-align:center;margin-top:8px">Sent by your Wedding Planner · ${new Date(d.generatedAt).toLocaleString()}</div>
  </div></body></html>`;
}
