import { Resend } from "resend";
import { prisma } from "@/lib/db";
import {
  buildDigestData,
  changesSince,
  renderDigestHtml,
  snapshotOf,
  type Snapshot,
} from "@/lib/digest";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SendResult {
  ok: boolean;
  status: "sent" | "skipped" | "failed";
  reason?: string;
  recipients?: string[];
  subject?: string;
}

// Builds and emails the digest to the two partners only. Writes an EmailLog row
// for every attempt. NEVER emails guests or anyone but the partner emails.
export async function sendDigest(
  type: "manual" | "weekly",
): Promise<SendResult> {
  const config = await prisma.config.findFirst({ orderBy: { id: "asc" } });

  const recipients = [config?.partner1Email, config?.partner2Email]
    .map((e) => (e ?? "").trim())
    .filter((e) => EMAIL_RE.test(e));

  if (recipients.length === 0) {
    return { ok: false, status: "skipped", reason: "No partner emails set in Settings." };
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      status: "skipped",
      reason: "Email not configured — set RESEND_API_KEY in .env.",
    };
  }

  // Guard against double-sends of the weekly digest (e.g. a retried cron tick).
  if (type === "weekly") {
    const since = new Date(Date.now() - 20 * 3600 * 1000);
    const recent = await prisma.emailLog.findFirst({
      where: { type: "weekly", status: "sent", sentAt: { gte: since } },
    });
    if (recent) {
      return { ok: true, status: "skipped", reason: "Weekly digest already sent today." };
    }
  }

  const data = await buildDigestData();
  const last = await prisma.emailLog.findFirst({
    where: { status: "sent" },
    orderBy: { sentAt: "desc" },
  });
  let prevSnapshot: Snapshot | null = null;
  if (last) {
    try {
      prevSnapshot = JSON.parse(last.snapshot) as Snapshot;
    } catch {
      prevSnapshot = null;
    }
  }

  const snapshot = snapshotOf(data);
  const changes = changesSince(prevSnapshot, snapshot);
  const html = renderDigestHtml(data, changes);
  const subject =
    data.daysToGo === null
      ? "Wedding planning digest"
      : `Wedding digest — ${data.daysToGo} days to go`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Wedding Planner <onboarding@resend.dev>",
      to: recipients,
      subject,
      html,
    });

    if (error) {
      await prisma.emailLog.create({
        data: {
          type,
          recipients: recipients.join(", "),
          subject,
          status: "failed",
          error: String(error.message ?? error),
          snapshot: JSON.stringify(snapshot),
        },
      });
      return { ok: false, status: "failed", reason: String(error.message ?? error) };
    }

    await prisma.emailLog.create({
      data: {
        type,
        recipients: recipients.join(", "),
        subject,
        status: "sent",
        snapshot: JSON.stringify(snapshot),
      },
    });
    return { ok: true, status: "sent", recipients, subject };
  } catch (err) {
    await prisma.emailLog.create({
      data: {
        type,
        recipients: recipients.join(", "),
        subject,
        status: "failed",
        error: String(err),
        snapshot: JSON.stringify(snapshot),
      },
    });
    return { ok: false, status: "failed", reason: String(err) };
  }
}
