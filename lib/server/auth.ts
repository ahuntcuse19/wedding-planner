// Session helpers for the simple shared-password gate. Uses Web Crypto (HMAC-
// SHA256) so the same code runs in the Edge middleware and Node route handlers.
// No DB, no user accounts — one shared password unlocks the app.

const enc = new TextEncoder();
const COOKIE = "wp_session";
const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const SESSION_COOKIE = COOKIE;

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += "=".repeat(pad);
  const bin = atob(s);
  // Allocate an explicit ArrayBuffer-backed view so it satisfies BufferSource
  // (crypto.subtle) without the SharedArrayBuffer ambiguity.
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const b64urlFromStr = (str: string) => b64urlFromBytes(enc.encode(str));
const strFromB64url = (s: string) => new TextDecoder().decode(b64urlToBytes(s));

function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

// Issue a signed session token: base64url(payload).base64url(hmac).
export async function signSession(secret: string, ttlMs = DEFAULT_TTL_MS): Promise<string> {
  const payload = b64urlFromStr(JSON.stringify({ exp: Date.now() + ttlMs }));
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${b64urlFromBytes(new Uint8Array(sig))}`;
}

// Verify signature + expiry. Returns false on any malformed/expired token.
export async function verifySession(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const key = await importKey(secret);
    const ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(sig), enc.encode(payload));
    if (!ok) return false;
    const { exp } = JSON.parse(strFromB64url(payload)) as { exp?: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

// Length-aware constant-time string comparison for the password check.
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
