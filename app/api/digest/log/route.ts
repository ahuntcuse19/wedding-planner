import { NextResponse } from "next/server";
import { repos } from "@/lib/server/sheets";
import type { EmailLogEntry } from "@/lib/types";

// History of sent/failed/skipped digests for the email-log view.
export async function GET() {
  const all = (await repos.emailLog.findMany()) as unknown as EmailLogEntry[];
  const log = all
    .sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))
    .slice(0, 50);
  return NextResponse.json(log);
}
