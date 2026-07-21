"use client";

import { formatIDRCompact } from "@/lib/format";
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

/**
 * Deliberately compact — the pipeline board shows all 6 stages side by
 * side on one screen (no horizontal scroll), so each card only has
 * ~150-180px on a normal desktop. Company/source text is dropped in favor
 * of the essentials (name, score, revenue, owner) so the whole pipeline
 * reads at a glance instead of needing to scroll for the full picture.
 */
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
        "cursor-grab space-y-0.5 rounded-md border border-l-2 bg-card p-1.5 text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:translate-y-0",
        ACCENT_BORDER[accent],
        ACCENT_WASH[accent],
        // Staleness is a more urgent signal than pipeline stage — wins when present.
        staleness === "overdue" && "border-l-destructive",
        staleness === "warning" && "border-l-amber-500",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="min-w-0 truncate font-medium">{lead.name}</div>
        {(staleness === "overdue" || staleness === "warning") && (
          <span
            title={
              staleness === "overdue"
                ? `No contact in ${FOLLOWUP_SLA_HOURS}+ hours`
                : "Follow-up due soon"
            }
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              staleness === "overdue" ? "bg-destructive" : "bg-amber-500",
            )}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-1 text-muted-foreground">
        <span className="min-w-0 truncate">{lead.owner?.name ?? "—"}</span>
        <span className="flex shrink-0 items-center gap-1">
          {lead.potentialRevenue != null && (
            <span className="tabular-nums">{formatIDRCompact(lead.potentialRevenue.toString())}</span>
          )}
          <LeadScoreBadge score={score} />
        </span>
      </div>
    </div>
  );
}
