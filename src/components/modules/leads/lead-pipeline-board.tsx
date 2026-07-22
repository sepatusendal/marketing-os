"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LeadCard, type LeadWithRelations } from "./lead-card";
import { LeadDrawer } from "./lead-drawer";
import { LostReasonDialog } from "./lost-reason-dialog";
import { updateLeadStatusAction } from "@/app/(app)/leads/actions";
import { LEAD_STATUS_ORDER, LEAD_STATUS_LABEL } from "@/lib/lead-labels";
import type { LeadStatus, LeadLostReason } from "@prisma/client";

const COLUMNS: { status: LeadStatus; label: string }[] = LEAD_STATUS_ORDER.map((status) => ({
  status,
  label: LEAD_STATUS_LABEL[status],
}));

export function LeadPipelineBoard({
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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadWithRelations | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [pendingLostLeadId, setPendingLostLeadId] = useState<string | null>(null);

  function commitStatusChange(leadId: string, status: LeadStatus, lostReason?: LeadLostReason) {
    startTransition(async () => {
      const result = await updateLeadStatusAction({ id: leadId, status, lostReason });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDrop(status: LeadStatus, leadId: string) {
    setDragOverColumn(null);
    if (!canEdit) return;
    if (status === "LOST") {
      setPendingLostLeadId(leadId);
      setLostDialogOpen(true);
      return;
    }
    commitStatusChange(leadId, status);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {canEdit && (
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
        )}
      </div>

      {/* 8 pipeline stages no longer fit on one screen without cramping each
          card — scroll horizontally instead, with each column pinned to a
          minimum width so cards stay readable. */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const columnLeads = leads.filter((l) => l.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(col.status);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => {
                e.preventDefault();
                const leadId = e.dataTransfer.getData("text/plain");
                if (leadId) handleDrop(col.status, leadId);
              }}
              className={cn(
                "flex min-h-40 w-44 shrink-0 flex-col gap-1.5 rounded-lg border bg-muted/20 p-2",
                dragOverColumn === col.status && "ring-2 ring-primary",
              )}
            >
              <div className="flex items-center justify-between px-0.5 text-xs font-medium">
                <span className="truncate">{col.label}</span>
                <span className="shrink-0 text-muted-foreground">{columnLeads.length}</span>
              </div>
              {columnLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  draggable={canEdit}
                  onOpen={(l) => {
                    setSelectedLead(l);
                    setDrawerOpen(true);
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>

      <LeadDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        lead={selectedLead}
        campaignOptions={campaignOptions}
        users={users}
        canEdit={canEdit}
      />

      <LostReasonDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        onCancel={() => {
          setLostDialogOpen(false);
          setPendingLostLeadId(null);
        }}
        onConfirm={(reason) => {
          setLostDialogOpen(false);
          if (pendingLostLeadId) commitStatusChange(pendingLostLeadId, "LOST", reason);
          setPendingLostLeadId(null);
        }}
      />
    </div>
  );
}
