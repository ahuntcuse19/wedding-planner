import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// History of sent/failed/skipped digests for the email-log view.
export async function GET() {
  const log = await prisma.emailLog.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
  });
  return NextResponse.json(log);
}
