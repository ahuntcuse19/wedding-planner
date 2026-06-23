"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { C } from "@/lib/theme";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

// Consume the toast API. Must be rendered under <ToastProvider> (mounted in
// the root layout), so every module can give consistent feedback.
export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const TONE: Record<ToastKind, { fg: string; bg: string; border: string }> = {
  success: { fg: C.success, bg: C.successSoft, border: C.success },
  error: { fg: C.danger, bg: C.dangerSoft, border: C.danger },
  info: { fg: C.ink, bg: C.surfaceAlt, border: C.border },
};

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback(
    (id: number) => setItems((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++counter;
      setItems((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 100,
          maxWidth: "min(360px, calc(100vw - 32px))",
        }}
      >
        {items.map((t) => {
          const tone = TONE[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "11px 13px",
                borderRadius: 12,
                background: tone.bg,
                color: tone.fg,
                border: `1px solid ${tone.border}`,
                boxShadow: "0 8px 24px rgba(40,34,28,0.15)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss notification"
                style={{
                  background: "transparent",
                  border: "none",
                  color: tone.fg,
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
