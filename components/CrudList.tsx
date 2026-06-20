"use client";

import React, { useMemo, useState } from "react";
import { C } from "@/lib/theme";
import { SCHEMAS, type Field, type Option } from "@/lib/schemas";
import type { EntitySlug } from "@/lib/types";
import { useEntity } from "@/hooks/useEntity";
import Modal from "./Modal";
import EntityEditor from "./EntityEditor";
import { Badge, Button, Card, Empty } from "./primitives";

interface Row {
  id: number;
  [key: string]: unknown;
}

const money = (n: number) => "$" + n.toLocaleString("en-US");

// Generic schema-driven list with add / edit / delete. Reused by guests,
// budget, vendors. Accepts dynamic option labels (e.g. partner names) and an
// optional external filter and per-item extra actions.
export default function CrudList({
  slug,
  optionOverrides,
  filter,
  toolbar,
  renderItemExtra,
  addLabel,
}: {
  slug: EntitySlug;
  optionOverrides?: Record<string, Option[]>;
  filter?: (item: Row) => boolean;
  toolbar?: React.ReactNode;
  renderItemExtra?: (item: Row, refresh: () => void) => React.ReactNode;
  addLabel?: string;
}) {
  const schema = SCHEMAS[slug];
  const { data, isLoading, create, update, remove, refresh } = useEntity<Row>(slug);
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);

  const items = useMemo(
    () => (filter ? data.filter(filter) : data),
    [data, filter],
  );

  const optionsFor = (f: Field): Option[] | undefined =>
    optionOverrides?.[f.key] ?? f.options;

  function formatValue(item: Row, f: Field): React.ReactNode {
    const v = item[f.key];
    if (f.type === "boolean") return v ? (f.trueLabel ?? "Yes") : (f.falseLabel ?? "No");
    if (v === null || v === undefined || v === "") return "—";
    if (f.type === "money") return money(Number(v));
    if (f.type === "select") {
      const opt = optionsFor(f)?.find((o) => o.value === v);
      const label = opt?.label ?? String(v);
      if (["status", "rsvp"].includes(f.key)) return <Badge value={label} />;
      return label;
    }
    return String(v);
  }

  const metaFields = schema.fields.filter((f) => f.inList && f.key !== schema.titleKey);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        {toolbar}
        <div style={{ flex: 1 }} />
        <Button onClick={() => setAdding(true)}>+ {addLabel ?? `Add ${schema.singular.toLowerCase()}`}</Button>
      </div>

      {isLoading ? (
        <Empty>Loading…</Empty>
      ) : items.length === 0 ? (
        <Empty>No {schema.plural.toLowerCase()} yet. Add your first one.</Empty>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <Card key={item.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 16 }}>
                    {String(item[schema.titleKey] ?? "—")}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
                    {metaFields.map((f) => (
                      <div key={f.key} style={{ fontSize: 13 }}>
                        <span style={{ color: C.inkSoft }}>{f.label}: </span>
                        <span style={{ color: C.ink }}>{formatValue(item, f)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {renderItemExtra?.(item, refresh)}
                  <Button variant="ghost" onClick={() => setEditing(item)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      if (!confirm(`Delete this ${schema.singular.toLowerCase()}?`)) return;
                      try {
                        await remove(item.id);
                      } catch {
                        alert(`Could not delete this ${schema.singular.toLowerCase()}. Please try again.`);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={`Add ${schema.singular.toLowerCase()}`}>
        <EntityEditor
          fields={schema.fields}
          optionOverrides={optionOverrides}
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            await create(values);
            setAdding(false);
          }}
        />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${schema.singular.toLowerCase()}`}>
        {editing && (
          <EntityEditor
            fields={schema.fields}
            initial={editing}
            optionOverrides={optionOverrides}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await update(editing.id, values);
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
