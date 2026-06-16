import { NextResponse } from "next/server";
import { sendDigest } from "@/lib/server/sendDigest";

// "Send digest now" button → emails both partners immediately.
export async function POST() {
  const result = await sendDigest("manual");
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
