// Thrown by server code to short-circuit a request with a specific HTTP status
// and JSON payload. Mapped to a Response in lib/server/handler.ts. Kept in its
// own module (no next/server import) so non-request code — the sheets data
// layer, repositories, CLI scripts — can throw it without pulling in the Next
// runtime.
export class HttpError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload ?? { error: message };
  }
}
