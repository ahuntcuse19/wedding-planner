"use client";

import { useEffect } from "react";
import { C, F } from "@/lib/theme";
import { Button } from "@/components/primitives";

// Route-segment error boundary. Catches render/runtime errors in any page and
// shows a themed recovery screen instead of the default Next.js overlay.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ textAlign: "center", padding: "64px 16px" }}>
      <h1 style={{ font: `600 30px ${F.display}`, color: C.ink, margin: 0 }}>
        Something went wrong
      </h1>
      <p style={{ color: C.inkSoft, margin: "10px 0 24px", fontSize: 15 }}>
        An unexpected error occurred. You can try again, or head back to the dashboard.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/")}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
