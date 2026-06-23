"use client";

import EntityEditor from "@/components/EntityEditor";
import { Card, PageTitle, ErrorState, Skeleton } from "@/components/primitives";
import { CONFIG_FIELDS } from "@/lib/schemas";
import { useConfig } from "@/hooks/useConfig";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const { config, isLoading, error, update, refresh } = useConfig();
  const toast = useToast();

  return (
    <div>
      <PageTitle
        title="Settings"
        subtitle="Dates, partner names, emails, budget range, and guest target."
      />
      {error ? (
        <ErrorState message="Couldn't load your settings." onRetry={() => refresh()} />
      ) : isLoading || !config ? (
        <Card style={{ maxWidth: 560, display: "grid", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton width="30%" height={12} style={{ marginBottom: 6 }} />
              <Skeleton height={38} radius={10} />
            </div>
          ))}
        </Card>
      ) : (
        <Card style={{ maxWidth: 560 }}>
          <EntityEditor
            fields={CONFIG_FIELDS}
            initial={config as unknown as Record<string, unknown>}
            submitLabel="Save settings"
            onCancel={() => refresh()}
            onSubmit={async (values) => {
              await update(values);
              toast.success("Settings saved.");
            }}
          />
        </Card>
      )}
    </div>
  );
}
