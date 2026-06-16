import { NextResponse } from "next/server";
import { sendDigest } from "@/lib/server/sendDigest";

// Weekly scheduled digest. Protect with CRON_SECRET, supplied either as
//   Authorization: Bearer <CRON_SECRET>   (Vercel Cron sends this automatically)
// or ?secret=<CRON_SECRET>                (handy for node-cron / curl).
// See README for scheduling. Default cadence: Sunday 18:00.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // refuse to run an unprotected cron route
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  const param = new URL(req.url).searchParams.get("secret");
  return param === secret;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendDigest("weekly");
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
