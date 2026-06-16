// Central theme tokens. Change the look-and-feel here, nowhere else.
// `C` = colors, `F` = typography. Consumed by components via inline styles and
// mirrored into CSS variables in app/globals.css for Tailwind/utility use.

export const C = {
  bg: "#faf6f0", // warm paper
  surface: "#ffffff",
  surfaceAlt: "#f4ece2", // cards / subtle panels
  border: "#e7dccd",
  ink: "#3a342e", // primary text
  inkSoft: "#7a6f63", // secondary text
  primary: "#a8755f", // terracotta rose — actions, accents
  primarySoft: "#f1e2db",
  accent: "#6f7f63", // sage — secondary accent
  accentSoft: "#e7ece0",
  gold: "#c2a063",
  danger: "#b24a40",
  dangerSoft: "#f6e2df",
  success: "#5f8a6a",
  successSoft: "#e3efe6",
  warning: "#c5852f",
  warningSoft: "#f7ead4",
} as const;

export const F = {
  display: "'Cormorant Garamond', 'Georgia', 'Times New Roman', serif",
  body: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

export type ColorToken = keyof typeof C;

// Status color mapping reused across modules (venues, vendors, tasks, rsvp).
export const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  // Venue
  Considering: { fg: C.inkSoft, bg: C.surfaceAlt },
  Shortlist: { fg: C.accent, bg: C.accentSoft },
  Toured: { fg: C.gold, bg: C.warningSoft },
  Booked: { fg: C.success, bg: C.successSoft },
  // Vendor
  Researching: { fg: C.inkSoft, bg: C.surfaceAlt },
  Contacted: { fg: C.gold, bg: C.warningSoft },
  Declined: { fg: C.danger, bg: C.dangerSoft },
  // Task
  Todo: { fg: C.inkSoft, bg: C.surfaceAlt },
  Doing: { fg: C.gold, bg: C.warningSoft },
  Done: { fg: C.success, bg: C.successSoft },
  // RSVP
  Pending: { fg: C.inkSoft, bg: C.surfaceAlt },
  Yes: { fg: C.success, bg: C.successSoft },
  No: { fg: C.danger, bg: C.dangerSoft },
  Maybe: { fg: C.gold, bg: C.warningSoft },
  // Email log
  sent: { fg: C.success, bg: C.successSoft },
  failed: { fg: C.danger, bg: C.dangerSoft },
  skipped: { fg: C.gold, bg: C.warningSoft },
};

export function statusStyle(value: string) {
  return STATUS_COLORS[value] ?? { fg: C.inkSoft, bg: C.surfaceAlt };
}
