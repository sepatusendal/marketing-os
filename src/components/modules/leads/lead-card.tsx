"use client";

import { formatIDR } from "@/lib/format";
import { FOLLOWUP_SLA_HOURS, getLeadStaleness } from "@/lib/lead-followup";
import { computeLeadScore } from "@/lib/lead-score";
import { LeadScoreBadge } from "./lead-score-badge";
import { cn } from "@/lib/utils";
import { ACCENT_BORDER, ACCENT_WASH, LEAD_STATUS_ACCENT } from "@/lib/accent-colors";
import type { Lead, User, Campaign, Client } from "@prisma/client";

export type LeadWithRelations = Omit<Lead, "potentialRevenue"> & {
  potentialRevenue: string | null;
  owner: User | null;
  campaign: Pick<Campaign, "id" | "name"> | null;
  client: Client | null;
};

export function LeadCard({
  lead,
  draggable = true,
  onOpen,
}: {
  lead: LeadWithRelations;
  draggable?: boolean;
  onOpen: (lead: LeadWithRelations) => void;
}) {
  const staleness = getLeadStaleness(lead);
  const score = computeLeadScore({
    source: lead.source,
    status: lead.status,
    potentialRevenue: lead.potentialRevenue != null ? Number(lead.potentialRevenue) : null,
  });
  const accent = LEAD_STATUS_ACCENT[lead.status];

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
      }}
      onClick={() => onOpen(lead)}
      className={cn(
        "cursor-grab space-y-1 rounded-md border border-l-2 bg-card p-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:translate-y-0",
        ACCENT_BORDER[accent],
        ACCENT_WASH[accent],
        // Staleness is a more urgent signal than pipeline stage — wins when present.
        staleness === "overdue" && "border-l-destructive",
        staleness === "warning" && "border-l-amber-500",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{lead.name}</div>
        <LeadScoreBadge score={score} className="shrink-0" />
        {staleness === "overdue" && (
          <span
            title={`No contact in ${FOLLOWUP_SLA_HOURS}+ hours`}
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"
          />
        )}
        {staleness === "warning" && (
          <span
            title="Follow-up due soon"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
          />
        )}
      </div>
      {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{lead.source}</span>
        {lead.potentialRevenue != null && (
          <span>{formatIDR(lead.potentialRevenue.toString())}</span>
        )}
      </div>
      {lead.owner && (
        <div className="text-xs text-muted-foreground">Owner: {lead.owner.name}</div>
      )}
    </div>
  );
}
