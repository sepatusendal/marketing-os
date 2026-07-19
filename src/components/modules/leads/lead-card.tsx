"use client";

import { formatIDR } from "@/lib/format";
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
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
      }}
      onClick={() => onOpen(lead)}
      className="cursor-grab space-y-1 rounded-md border bg-card p-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md active:cursor-grabbing active:translate-y-0"
    >
      <div className="font-medium">{lead.name}</div>
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
