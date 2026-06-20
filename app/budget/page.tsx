"use client";

import CrudList from "@/components/CrudList";
import { PageTitle, Stat } from "@/components/primitives";
import { useEntity } from "@/hooks/useEntity";
import { useConfig } from "@/hooks/useConfig";
import type { BudgetLine } from "@/lib/types";

const money = (n: number) => "$" + n.toLocaleString("en-US");

export default function BudgetPage() {
  const { data } = useEntity<BudgetLine>("budget");
  const { config } = useConfig();
  const total = data.reduce((s, b) => s + (b.actualCost ?? b.estCost ?? 0), 0);
  const max = config?.budgetMax ?? 0;
  const over = max > 0 && total > max;

  return (
    <div>
      <PageTitle title="Budget" subtitle="Estimated and actual costs across categories." />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", marginBottom: 20 }}>
        <Stat
          label="Running total"
          value={money(total)}
          tone={over ? "danger" : "default"}
          hint={config ? `Target ${money(config.budgetMin)}–${money(config.budgetMax)}` : undefined}
        />
        <Stat
          label="Remaining vs max"
          value={money(Math.max(0, max - total))}
          tone={over ? "danger" : "success"}
          hint={over ? `Over by ${money(total - max)}` : "Within budget"}
        />
      </div>
      <CrudList slug="budget" />
    </div>
  );
}
