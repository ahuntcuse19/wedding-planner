"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { C, F } from "@/lib/theme";
import { Button, Card } from "@/components/primitives";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error ?? "Incorrect password.");
        return;
      }
      // Only allow same-origin relative paths — reject protocol-relative
      // ("//host") and absolute URLs to prevent an open redirect.
      const next = params.get("next") || "/";
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      router.replace(safeNext);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ width: "100%", maxWidth: 380 }}>
      <h1 style={{ font: `600 26px ${F.display}`, color: C.ink, margin: "0 0 4px", textAlign: "center" }}>
        Our Wedding
      </h1>
      <p style={{ color: C.inkSoft, fontSize: 14, textAlign: "center", margin: "0 0 20px" }}>
        Enter the password to continue.
      </p>
      <form onSubmit={submit}>
        <label htmlFor="password" style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 5 }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "login-error" : undefined}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${error ? C.danger : C.border}`,
            background: C.surface,
            color: C.ink,
            fontSize: 14,
          }}
        />
        {error && (
          <div id="login-error" role="alert" style={{ color: C.danger, fontSize: 13, fontWeight: 600, marginTop: 8 }}>
            {error}
          </div>
        )}
        <Button type="submit" disabled={busy} style={{ width: "100%", marginTop: 16 }}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
