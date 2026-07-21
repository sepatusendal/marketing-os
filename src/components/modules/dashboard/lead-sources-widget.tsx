import { Radar } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { DonutChart } from "@/components/ui/charts/donut-chart";
import { WIDGET_ACCENT, LEAD_SOURCE_ACCENT, ACCENT_HEX } from "@/lib/accent-colors";
import type { LeadSource } from "@prisma/client";

const SOURCE_LABEL: Record<LeadSource, string> = {
  WEBSITE: "Website",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  REFERRAL: "Referral",
  EVENT: "Event",
  PAID_ADS: "Paid Ads",
  EMAIL: "Email",
  OTHER: "Other",
};

export function LeadSourcesWidget({ data }: { data: { source: LeadSource; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <WidgetCard title="Lead Sources" accent={WIDGET_ACCENT.leadSummary} icon={Radar}>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No leads yet.</p>
      ) : (
        <DonutChart
          centerValue={total.toString()}
          centerLabel="total leads"
          data={data.map((d) => ({
            key: d.source,
            label: SOURCE_LABEL[d.source],
            value: d.count,
            colorHex: ACCENT_HEX[LEAD_SOURCE_ACCENT[d.source]],
          }))}
        />
      )}
    </WidgetCard>
  );
}
