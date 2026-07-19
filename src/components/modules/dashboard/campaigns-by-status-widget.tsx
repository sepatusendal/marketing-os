import { WidgetCard } from "./widget-card";
import { CampaignStatusBadge } from "@/components/modules/campaigns/status-badge";
import type { CampaignStatus } from "@prisma/client";

export function CampaignsByStatusWidget({
  data,
}: {
  data: { status: CampaignStatus; count: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <WidgetCard title="Campaigns by Status">
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((d) => (
            <li key={d.status} className="flex items-center justify-between text-sm">
              <CampaignStatusBadge status={d.status} />
              <span className="text-muted-foreground">{d.count}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
