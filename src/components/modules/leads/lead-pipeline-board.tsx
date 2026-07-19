"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LeadCard, type LeadWithRelations } from "./lead-card";
import { LeadDrawer } from "./lead-drawer";
import { updateLeadStatusAction } from "@/app/(app)/leads/actions";
import type { LeadStatus } from "@prisma/client";

const COLUMNS: { status: LeadStatus; label: string }[] = [
  { status: "NEW", label: "New" },
  { status: "CONTACTED", label: "Contacted" },
  { status: "QUALIFIED", label: "Qualified" },
  { status: "NEGOTIATION", label: "Negotiation" },
  { status: "WON", label: "Won" },
  { status: "LOST", label: "Lost" },
];

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

  function handleDrop(status: LeadStatus, leadId: string) {
    setDragOverColumn(null);
    if (!canEdit) return;
    startTransition(async () => {
      const result = await updateLeadStatusAction({ id: leadId, status });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                "flex min-h-40 flex-col gap-2 rounded-lg border bg-muted/20 p-3",
                dragOverColumn === col.status && "ring-2 ring-primary",
              )}
            >
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{col.label}</span>
                <span className="text-muted-foreground">{columnLeads.length}</span>
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
    </div>
  );
}
