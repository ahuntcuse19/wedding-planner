"use client";

import React, { useEffect, useRef } from "react";
import { C, F } from "@/lib/theme";

// Accessible modal: Escape to close, backdrop click to close, focus moves in,
// labelled by its title. Reduced-motion is handled globally in globals.css.
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(40,34,28,0.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "5vh 16px",
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      <div
        ref={ref}
        style={{
          background: C.surface,
          borderRadius: 18,
          border: `1px solid ${C.border}`,
          width: "100%",
          maxWidth: "min(520px, calc(100vw - 32px))",
          boxShadow: "0 24px 60px rgba(40,34,28,0.25)",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ font: `600 22px ${F.display}`, color: C.ink, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              lineHeight: 1,
              cursor: "pointer",
              color: C.inkSoft,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}
