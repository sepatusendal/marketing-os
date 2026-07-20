import Link from "next/link";
import { WidgetCard } from "./widget-card";
import { hoursSinceContact } from "@/lib/lead-followup";
import type { Lead, User, Campaign } from "@prisma/client";

function agoLabel(hours: number) {
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days}d ago`;
  return `${Math.max(1, Math.floor(hours))}h ago`;
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
    <WidgetCard title={`Needs Follow-up (${leads.length})`}>
      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">All leads contacted within SLA. Nice.</p>
      ) : (
        <ul className="space-y-2">
          {leads.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
              <Link href="/leads?view=table" className="flex items-center gap-2 hover:underline">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                {l.name}
              </Link>
              <span className="text-xs text-destructive">
                {agoLabel(hoursSinceContact(l))}
                {l.owner && ` · ${l.owner.name}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
