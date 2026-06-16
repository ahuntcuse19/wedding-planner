"use client";

import { useState } from "react";
import useSWR from "swr";
import { C } from "@/lib/theme";
import { Badge, Button, Card, Empty, PageTitle } from "@/components/primitives";
import { useConfig } from "@/hooks/useConfig";
import type { EmailLogEntry } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DigestPage() {
  const { config } = useConfig();
  const { data: log, mutate } = useSWR<EmailLogEntry[]>("/api/digest/log", fetcher);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; reason?: string; status?: string } | null>(null);

  const recipients = [config?.partner1Email, config?.partner2Email].filter((e) => e && e.trim());

  async function sendNow() {
    setSending(true);
    setResult(null);
    try {
      const r = await fetch("/api/digest/send", { method: "POST" });
      const d = await r.json();
      setResult(d);
      await mutate();
    } catch {
      setResult({ ok: false, reason: "Request failed" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageTitle title="Email digest" subtitle="Send a planning summary to both partners." />

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: C.ink, marginBottom: 6 }}>
          Recipients:{" "}
          {recipients.length ? (
            <strong>{recipients.join(", ")}</strong>
          ) : (
            <span style={{ color: C.danger }}>no partner emails set — add them in Settings</span>
          )}
        </div>
        <div style={{ color: C.inkSoft, fontSize: 13, marginBottom: 14 }}>
          The digest includes the countdown, headcount vs target, budget vs range, open tasks by owner,
          vendor status, and what changed since the last send. Digests are emailed to the two partners only.
        </div>
        <Button onClick={sendNow} disabled={sending || recipients.length === 0}>
          {sending ? "Sending…" : "Send digest now"}
        </Button>
        {result && (
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              fontWeight: 600,
              color: result.ok ? C.accent : C.danger,
            }}
          >
            {result.ok
              ? result.status === "skipped"
                ? `Skipped: ${result.reason}`
                : "✓ Digest sent."
              : `Could not send: ${result.reason}`}
          </div>
        )}
        <div style={{ color: C.inkSoft, fontSize: 12.5, marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          A weekly digest can be scheduled (default Sunday 6pm) via Vercel Cron or a node-cron worker hitting{" "}
          <code style={{ background: C.surfaceAlt, padding: "1px 5px", borderRadius: 5 }}>/api/cron/digest</code>. See the README.
        </div>
      </Card>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 12px" }}>History</h2>
      {!log ? (
        <Empty>Loading…</Empty>
      ) : log.length === 0 ? (
        <Empty>No digests sent yet.</Empty>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {log.map((e) => (
            <Card key={e.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{e.subject}</div>
                  <div style={{ color: C.inkSoft, fontSize: 12.5 }}>
                    {new Date(e.sentAt).toLocaleString()} · {e.type} · {e.recipients || "—"}
                  </div>
                  {e.error && <div style={{ color: C.danger, fontSize: 12.5 }}>{e.error}</div>}
                </div>
                <Badge value={e.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
