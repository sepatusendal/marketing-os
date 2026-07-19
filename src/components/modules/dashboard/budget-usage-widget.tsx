import Link from "next/link";
import { WidgetCard } from "./widget-card";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  return (
    <WidgetCard
      title="Budget Usage"
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
      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className={cn(
              "h-2 rounded-full",
              usage.percentUsed > 100 ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span>
            {formatIDR(usage.used)} / {formatIDR(usage.allocated)}
          </span>
          <span className="text-muted-foreground">{usage.percentUsed}%</span>
        </div>
      </div>
    </WidgetCard>
  );
}
