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
        <p className="text-sm text-muted-foreground">No leads match these filters.</p>
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
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer"
              onClick={() => {
                setSelectedLead(lead);
                setDrawerOpen(true);
              }}
            >
              <TableCell className="font-medium">{lead.name}</TableCell>
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
          ))}
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
