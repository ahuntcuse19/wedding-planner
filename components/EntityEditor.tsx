"use client";

import React, { useState } from "react";
import { C } from "@/lib/theme";
import type { Field, Option } from "@/lib/schemas";
import { Button } from "./primitives";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: C.ink,
  marginBottom: 5,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  background: C.surface,
  color: C.ink,
  fontSize: 14,
  fontFamily: "inherit",
};

// Renders a form purely from a Field[] schema. Used by every module for
// add/edit, so a new field appears everywhere by editing the schema only.
export default function EntityEditor({
  fields,
  initial,
  optionOverrides,
  submitLabel = "Save",
  onSubmit,
  onCancel,
}: {
  fields: Field[];
  initial?: Record<string, unknown>;
  optionOverrides?: Record<string, Option[]>;
  submitLabel?: string;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const v: Record<string, unknown> = {};
    for (const f of fields) {
      const start = initial?.[f.key];
      if (f.type === "boolean") v[f.key] = Boolean(start);
      else v[f.key] = start ?? "";
    }
    return v;
  });
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: unknown) => setValues((p) => ({ ...p, [key]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: "grid", gap: 14 }}>
        {fields.map((f) => {
          const options = optionOverrides?.[f.key] ?? f.options;
          const id = `field-${f.key}`;
          return (
            <div key={f.key}>
              {f.type === "boolean" ? (
                <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: C.ink }}>
                  <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(values[f.key])}
                    onChange={(e) => set(f.key, e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  {f.label}
                </label>
              ) : (
                <>
                  <label htmlFor={id} style={labelStyle}>
                    {f.label}
                    {f.required && <span style={{ color: C.danger }}> *</span>}
                  </label>
                  {f.type === "select" ? (
                    <select id={id} required={f.required} value={String(values[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} style={inputStyle}>
                      <option value="">—</option>
                      {(options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea id={id} value={String(values[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder={f.placeholder} />
                  ) : (
                    <input
                      id={id}
                      required={f.required}
                      type={f.type === "money" || f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text"}
                      value={String(values[f.key] ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                      style={inputStyle}
                      placeholder={f.placeholder}
                    />
                  )}
                  {f.help && <div style={{ color: C.inkSoft, fontSize: 12, marginTop: 4 }}>{f.help}</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
