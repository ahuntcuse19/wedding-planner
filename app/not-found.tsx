import Link from "next/link";
import { C, F } from "@/lib/theme";

// Themed 404 for unknown routes.
export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "64px 16px" }}>
      <h1 style={{ font: `600 30px ${F.display}`, color: C.ink, margin: 0 }}>
        Page not found
      </h1>
      <p style={{ color: C.inkSoft, margin: "10px 0 24px", fontSize: 15 }}>
        That page doesn&apos;t exist. Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "9px 16px",
          borderRadius: 10,
          background: C.primary,
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Go to dashboard
      </Link>
    </div>
  );
}
