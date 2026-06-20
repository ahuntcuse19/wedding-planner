"use client";

import { useState } from "react";
import EntityEditor from "@/components/EntityEditor";
import { Card, PageTitle, Empty } from "@/components/primitives";
import { C } from "@/lib/theme";
import { CONFIG_FIELDS } from "@/lib/schemas";
import { useConfig } from "@/hooks/useConfig";

export default function SettingsPage() {
  const { config, update, refresh } = useConfig();
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <PageTitle
        title="Settings"
        subtitle="Dates, partner names, emails, budget range, and guest target."
      />
      {!config ? (
        <Empty>Loading…</Empty>
      ) : (
        <Card style={{ maxWidth: 560 }}>
          <EntityEditor
            fields={CONFIG_FIELDS}
            initial={config as unknown as Record<string, unknown>}
            submitLabel="Save settings"
            onCancel={() => refresh()}
            onSubmit={async (values) => {
              await update(values);
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            }}
          />
          {saved && (
            <div style={{ color: C.accent, fontWeight: 600, marginTop: 12, fontSize: 14 }}>
              ✓ Saved.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
