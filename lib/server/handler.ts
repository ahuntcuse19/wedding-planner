import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Thrown by handlers to short-circuit with a specific status + payload.
export class HttpError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload ?? { error: message };
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// Wrap a route handler so thrown errors become clean JSON responses instead of
// raw 500 stack traces. Prisma "record not found" maps to 404.
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
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        return NextResponse.json({ error: "Not found." }, { status: 404 });
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
