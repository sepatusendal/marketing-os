import Link from "next/link";
import { PieChart } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { HorizontalBarChart } from "@/components/ui/charts/horizontal-bar-chart";
import { WIDGET_ACCENT, CAMPAIGN_STATUS_BAR } from "@/lib/accent-colors";
import type { CampaignStatus } from "@prisma/client";

export function CampaignsByStatusWidget({
  data,
}: {
  data: { status: CampaignStatus; count: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <WidgetCard
      title="Campaign Status"
      accent={WIDGET_ACCENT.campaignsByStatus}
      icon={PieChart}
      action={
        <Link href="/campaigns" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
          View all
        </Link>
      }
    >
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns yet.</p>
      ) : (
        <HorizontalBarChart
          data={data.map((d) => {
            const pct = Math.round((d.count / total) * 100);
            return {
              key: d.status,
              label: d.status,
              value: d.count,
              valueLabel: `${d.count} · ${pct}%`,
              colorClass: CAMPAIGN_STATUS_BAR[d.status],
              detail: `${pct}% of ${total} campaign${total === 1 ? "" : "s"}`,
            };
          })}
        />
      )}
    </WidgetCard>
  );
}
