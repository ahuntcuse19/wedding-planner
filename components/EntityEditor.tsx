"use client";

import React, { useState } from "react";
import { C } from "@/lib/theme";
import { validateFields, type Field, type Option } from "@/lib/schemas";
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
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: unknown) => {
    setValues((p) => ({ ...p, [key]: val }));
    // Clear a field's error as soon as the user edits it.
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation using the same rules the server enforces.
    const result = validateFields(fields, values);
    if (!result.ok) {
      setFieldErrors(result.errors);
      const firstInvalid = fields.find((f) => result.errors[f.key]);
      if (firstInvalid) document.getElementById(`field-${firstInvalid.key}`)?.focus();
      return;
    }
    setFieldErrors({});

    setSaving(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      // Keep the modal open and show why the save failed.
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
          const err = fieldErrors[f.key];
          const errId = `${id}-error`;
          const describedBy = err ? errId : undefined;
          const controlStyle = err
            ? { ...inputStyle, borderColor: C.danger }
            : inputStyle;
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
                    <select id={id} required={f.required} aria-invalid={!!err} aria-describedby={describedBy} value={String(values[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} style={controlStyle}>
                      <option value="">—</option>
                      {(options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea id={id} aria-invalid={!!err} aria-describedby={describedBy} value={String(values[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} rows={3} style={{ ...controlStyle, resize: "vertical" }} placeholder={f.placeholder} />
                  ) : (
                    <input
                      id={id}
                      required={f.required}
                      aria-invalid={!!err}
                      aria-describedby={describedBy}
                      type={f.type === "money" || f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text"}
                      value={String(values[f.key] ?? "")}
                      onChange={(e) => set(f.key, e.target.value)}
                      style={controlStyle}
                      placeholder={f.placeholder}
                    />
                  )}
                  {err ? (
                    <div id={errId} role="alert" style={{ color: C.danger, fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                      {err}
                    </div>
                  ) : (
                    f.help && <div style={{ color: C.inkSoft, fontSize: 12, marginTop: 4 }}>{f.help}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <div role="alert" style={{ color: C.danger, fontSize: 13, fontWeight: 600, marginTop: 14 }}>
          {error}
        </div>
      )}
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
