import Link from "next/link";
import { AlarmClock } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LeadScoreBadge } from "@/components/modules/leads/lead-score-badge";
import { hoursSinceContact } from "@/lib/lead-followup";
import { computeLeadScore } from "@/lib/lead-score";
import { WIDGET_ACCENT } from "@/lib/accent-colors";
import type { Lead, User, Campaign } from "@prisma/client";

function agoLabel(hours: number) {
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d overdue`;
  return `${Math.max(1, Math.floor(hours))}h overdue`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function FollowupWidget({
  leads,
}: {
  leads: (Lead & {
    owner: User | null;
    campaign: Pick<Campaign, "id" | "name"> | null;
  })[];
}) {
  return (
    <WidgetCard
      title={`Needs Follow-up (${leads.length})`}
      accent={WIDGET_ACCENT.followup}
      icon={AlarmClock}
      action={
        <Link href="/leads?view=table" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
          View all
        </Link>
      }
    >
      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">All leads contacted within SLA. Nice.</p>
      ) : (
        <ul className="space-y-1">
          {leads.map((l) => {
            const score = computeLeadScore({
              source: l.source,
              status: l.status,
              potentialRevenue: l.potentialRevenue != null ? Number(l.potentialRevenue) : null,
            });
            return (
              <li key={l.id}>
                <Link
                  href="/leads?view=table"
                  className="flex items-center gap-3 rounded-lg p-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-destructive/10 text-xs font-medium text-destructive">
                      {initials(l.owner?.name ?? l.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium text-foreground">{l.name}</span>
                      <LeadScoreBadge score={score} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.owner?.name ?? "Unassigned"}
                      {l.campaign && ` · ${l.campaign.name}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-destructive">
                    {agoLabel(hoursSinceContact(l))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
