import Link from "next/link";
import { WidgetCard } from "./widget-card";
import { formatDate } from "@/lib/format";
import type { Campaign, User } from "@prisma/client";

export function ActiveCampaignsWidget({
  campaigns,
}: {
  campaigns: (Campaign & { owner: User })[];
}) {
  return (
    <WidgetCard title={`Active Campaigns (${campaigns.length})`}>
      {campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns running right now.</p>
      ) : (
        <ul className="space-y-2">
          {campaigns.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-sm">
              <Link href={`/campaigns/${c.id}`} className="hover:underline">
                {c.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {c.owner.name} · ends {formatDate(c.endDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
