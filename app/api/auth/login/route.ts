import { NextResponse } from "next/server";
import { SESSION_COOKIE, safeEqual, signSession } from "@/lib/server/auth";
import { readJson } from "@/lib/server/handler";

export async function POST(req: Request) {
  const body = await readJson(req);
  const password = body.password;
  const expected = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!expected || !secret) {
    return NextResponse.json({ error: "Sign-in is not configured." }, { status: 500 });
  }
  if (typeof password !== "string" || !safeEqual(password, expected)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await signSession(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
