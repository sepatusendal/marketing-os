"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatIDR } from "@/lib/format";
import { EmptyIllustration } from "@/components/ui/empty-illustration";
import { getLeadStaleness } from "@/lib/lead-followup";
import { cn } from "@/lib/utils";
import { LeadDrawer } from "./lead-drawer";
import type { LeadWithRelations } from "./lead-card";

export function LeadTable({
  leads,
  campaignOptions,
  users,
  canEdit,
}: {
  leads: LeadWithRelations[];
  campaignOptions: { id: string; name: string }[];
  users: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const [selectedLead, setSelectedLead] = useState<LeadWithRelations | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setSelectedLead(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            New Lead
          </Button>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <EmptyIllustration className="h-24 w-32" />
          <p>No leads match these filters.</p>
        </div>
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Last contact</TableHead>
            <TableHead className="text-right">Potential revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const staleness = getLeadStaleness(lead);
            return (
            <TableRow
              key={lead.id}
              className={cn(
                "cursor-pointer",
                staleness === "overdue" && "bg-destructive/5",
              )}
              onClick={() => {
                setSelectedLead(lead);
                setDrawerOpen(true);
              }}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {staleness !== "none" && staleness !== "fresh" && (
                    <span
                      title={staleness === "overdue" ? "Overdue for follow-up" : "Follow-up due soon"}
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        staleness === "overdue" ? "bg-destructive" : "bg-amber-500",
                      )}
                    />
                  )}
                  {lead.name}
                </div>
              </TableCell>
              <TableCell>{lead.company ?? "—"}</TableCell>
              <TableCell>{lead.status}</TableCell>
              <TableCell>{lead.source}</TableCell>
              <TableCell>{lead.owner?.name ?? "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(lead.lastContactAt)}
              </TableCell>
              <TableCell className="text-right">
                {lead.potentialRevenue != null ? formatIDR(lead.potentialRevenue.toString()) : "—"}
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
      )}

      <LeadDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        lead={selectedLead}
        campaignOptions={campaignOptions}
        users={users}
        canEdit={canEdit}
      />
    </div>
  );
}
