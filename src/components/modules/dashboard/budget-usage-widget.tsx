import Link from "next/link";
import { Wallet } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { DonutChart } from "@/components/ui/charts/donut-chart";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WIDGET_ACCENT, STATUS_TEXT, STATUS_HEX, budgetStatus } from "@/lib/accent-colors";
import type { BudgetPeriod } from "@/server/dashboard.service";

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "all", label: "All time" },
];

export function BudgetUsageWidget({
  usage,
  period,
}: {
  usage: { allocated: number; used: number; remaining: number; percentUsed: number };
  period: BudgetPeriod;
}) {
  const status = budgetStatus(usage.percentUsed);
  const overBudget = usage.percentUsed > 100;

  return (
    <WidgetCard
      title="Budget Overview"
      accent={WIDGET_ACCENT.budget}
      icon={Wallet}
      action={
        <div className="flex gap-1 text-xs">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/dashboard?budgetPeriod=${p.value}`}
              className={cn(
                "rounded px-2 py-1",
                period === p.value ? "bg-secondary" : "text-muted-foreground",
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
      }
    >
      <DonutChart
        centerValue={`${usage.percentUsed}%`}
        centerLabel={overBudget ? "over budget" : "used"}
        valueFormat="idr"
        data={
          overBudget
            ? [{ key: "used", label: "Used (over budget)", value: usage.used, colorHex: STATUS_HEX.critical }]
            : [
                { key: "used", label: "Used", value: usage.used, colorHex: STATUS_HEX[status] },
                { key: "remaining", label: "Left", value: usage.remaining, colorHex: "var(--muted-foreground)" },
              ]
        }
      />
      <p className={cn("mt-3 text-xs", STATUS_TEXT[status])}>
        {formatIDR(usage.used)} of {formatIDR(usage.allocated)} total budget
      </p>
    </WidgetCard>
  );
}
