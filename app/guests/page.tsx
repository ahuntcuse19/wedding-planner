"use client";

import CrudList from "@/components/CrudList";
import { PageTitle } from "@/components/primitives";
import { useConfig } from "@/hooks/useConfig";

export default function GuestsPage() {
  const { config } = useConfig();
  // "Side" reuses the partner-name labels so it stays in sync with Settings.
  const sideOptions = [
    { value: "Partner1", label: config?.partner1Name || "Katie" },
    { value: "Partner2", label: config?.partner2Name || "Me" },
    { value: "Both", label: "Both" },
  ];
  return (
    <div>
      <PageTitle title="Guests" subtitle="Track invitations and RSVPs." />
      <CrudList slug="guests" optionOverrides={{ side: sideOptions }} />
    </div>
  );
}
