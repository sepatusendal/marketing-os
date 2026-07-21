import Link from "next/link";
import { TrendingUp, Users, Wallet, CheckCircle2 } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { AreaLineChart } from "@/components/ui/charts/area-line-chart";
import { ACCENT_HEX, ACCENT_CHIP, WIDGET_ACCENT } from "@/lib/accent-colors";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PerformanceRange } from "@/server/dashboard.service";

const RANGES: { value: PerformanceRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "month", label: "This Month" },
];

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}

export function CampaignPerformanceWidget({
  trend,
  range,
}: {
  trend: { labels: string[]; newLeads: number[]; tasksCompleted: number[]; budgetSpent: number[] };
  range: PerformanceRange;
}) {
  const totalLeads = sum(trend.newLeads);
  const totalSpent = sum(trend.budgetSpent);
  const totalCompleted = sum(trend.tasksCompleted);

  const tiles = [
    { key: "leads", label: "New Leads", value: totalLeads.toString(), icon: Users, accent: "emerald" as const },
    { key: "spent", label: "Budget Spent", value: formatIDR(totalSpent), icon: Wallet, accent: "amber" as const },
    {
      key: "done",
      label: "Tasks Completed",
      value: totalCompleted.toString(),
      icon: CheckCircle2,
      accent: "blue" as const,
    },
  ];

  return (
    <WidgetCard
      title="Campaign Performance"
      accent={WIDGET_ACCENT.activeCampaigns}
      icon={TrendingUp}
      action={
        <div className="flex gap-1 text-xs">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/dashboard?performanceRange=${r.value}`}
              className={cn(
                "rounded px-2 py-1",
                range === r.value ? "bg-secondary" : "text-muted-foreground",
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {tiles.map((t) => (
            <div key={t.key} className="rounded-lg border bg-background/50 p-3">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", ACCENT_CHIP[t.accent])}>
                <t.icon className="h-3.5 w-3.5" />
              </span>
              <p className="mt-2 text-lg font-semibold text-foreground">{t.value}</p>
              <p className="text-xs text-muted-foreground">{t.label}</p>
            </div>
          ))}
        </div>

        <AreaLineChart
          labels={trend.labels}
          series={[
            { key: "leads", label: "New Leads", colorHex: ACCENT_HEX.emerald, values: trend.newLeads },
            { key: "done", label: "Tasks Completed", colorHex: ACCENT_HEX.blue, values: trend.tasksCompleted },
          ]}
        />
      </div>
    </WidgetCard>
  );
}
