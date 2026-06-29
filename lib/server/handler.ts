import { NextResponse } from "next/server";
import { HttpError } from "@/lib/server/errors";

// Re-exported so existing route imports (`from "@/lib/server/handler"`) keep
// working; the class itself lives in errors.ts (no Next dependency).
export { HttpError };

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// Wrap a route handler so thrown errors become clean JSON responses instead of
// raw 500 stack traces. The data layer throws HttpError(404) for a missing row.
export function withErrors<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json(err.payload, { status: err.status });
      }
      console.error("API error:", err);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
  };
}

// Parse + guard a positive integer id from a route param.
export function parseId(id: string): number {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, "Invalid id.");
  return n;
}

// Parse a JSON body, returning {} for empty/invalid bodies (callers validate).
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
