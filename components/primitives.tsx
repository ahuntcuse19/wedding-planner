"use client";

import React from "react";
import { C, F, statusStyle } from "@/lib/theme";

// Small themed building blocks. All styling flows from lib/theme.ts.

type ButtonVariant = "primary" | "ghost" | "danger" | "subtle";

export function Button({
  variant = "primary",
  children,
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: { background: C.primary, color: "#fff", border: `1px solid ${C.primary}` },
    danger: { background: C.surface, color: C.danger, border: `1px solid ${C.danger}` },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.border}` },
    subtle: { background: C.surfaceAlt, color: C.ink, border: `1px solid ${C.border}` },
  };
  return (
    <button
      {...props}
      style={{
        padding: "8px 14px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.55 : 1,
        transition: "filter .15s ease",
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Badge({ value }: { value: string }) {
  const s = statusStyle(value);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: s.fg,
        background: s.bg,
      }}
    >
      {value}
    </span>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ font: `600 30px ${F.display}`, color: C.ink, margin: 0 }}>{title}</h1>
      {subtitle && (
        <p style={{ color: C.inkSoft, margin: "4px 0 0", fontSize: 15 }}>{subtitle}</p>
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "default" | "danger" | "success";
}) {
  const color = tone === "danger" ? C.danger : tone === "success" ? C.success : C.ink;
  return (
    <Card>
      <div style={{ font: "600 12px system-ui", letterSpacing: ".05em", textTransform: "uppercase", color: C.inkSoft }}>
        {label}
      </div>
      <div style={{ font: `600 28px ${F.display}`, color, marginTop: 6 }}>{value}</div>
      {hint && <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 4 }}>{hint}</div>}
    </Card>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        color: C.inkSoft,
        padding: "32px 16px",
        border: `1px dashed ${C.border}`,
        borderRadius: 14,
      }}
    >
      {children}
    </div>
  );
}
