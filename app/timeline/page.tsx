"use client";

import { useState } from "react";
import CrudList from "@/components/CrudList";
import { PageTitle } from "@/components/primitives";
import { C } from "@/lib/theme";
import { useConfig } from "@/hooks/useConfig";
import { ownerOptions, ownerLabel } from "@/lib/types";

export default function TimelinePage() {
  const { config } = useConfig();
  const [owner, setOwner] = useState<string>("all");

  const options = ownerOptions(config);
  const overrides = { owner: options };

  // Filter chips: All + one per owner. Partner chips read as "Katie's tasks" /
  // "My tasks", driven by the partner-name settings (never hardcoded).
  const chips: { value: string; label: string }[] = [
    { value: "all", label: "All tasks" },
    ...options.map((o) => ({
      value: o.value,
      label:
        o.value === "Partner1" || o.value === "Partner2"
          ? `${ownerLabel(o.value, config)}'s tasks`
          : o.label,
    })),
  ];

  return (
    <div>
      <PageTitle title="Timeline" subtitle="Tasks and who owns them." />
      <CrudList
        slug="tasks"
        optionOverrides={overrides}
        addLabel="Add task"
        filter={owner === "all" ? undefined : (item) => item.owner === owner}
        toolbar={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {chips.map((c) => {
              const active = owner === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setOwner(c.value)}
                  aria-pressed={active}
                  style={{
                    padding: "7px 13px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    border: `1px solid ${active ? C.primary : C.border}`,
                    background: active ? C.primary : C.surface,
                    color: active ? "#fff" : C.inkSoft,
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        }
      />
    </div>
  );
}
