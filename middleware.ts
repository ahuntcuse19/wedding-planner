import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/server/auth";

// Public paths that never require the password gate.
const PUBLIC_PATHS = new Set(["/login"]);
// API prefixes with their own auth (or none): /api/auth/* (login/logout),
// /api/cron/* (protected by CRON_SECRET).
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/cron/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  const password = process.env.APP_PASSWORD;
  // If the gate isn't configured, fail open so the app is never locked out by a
  // missing env var. Documented in the README — set both to enable the gate.
  if (!secret || !password) return NextResponse.next();

  const valid = await verifySession(secret, req.cookies.get(SESSION_COOKIE)?.value);
  if (valid) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
