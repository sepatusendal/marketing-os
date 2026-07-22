"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { listCommentsAction } from "@/lib/actions/comment";
import { listLeadTimelineAction } from "@/lib/actions/activity";
import { CommentThread } from "@/components/modules/comments/comment-thread";
import { CampaignTimeline as ActivityTimeline } from "@/components/modules/campaigns/campaign-timeline";
import type { ActivityLog, Comment, User as PrismaUser } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createLeadAction,
  updateLeadAction,
  updateLeadStatusAction,
  touchLastContactAction,
  setNextFollowUpAction,
  convertToClientAction,
  type ActionState,
} from "@/app/(app)/leads/actions";
import { formatDate } from "@/lib/format";
import { LEAD_STATUS_ORDER, LEAD_STATUS_LABEL, LEAD_LOST_REASON_LABEL } from "@/lib/lead-labels";
import { LostReasonDialog } from "./lost-reason-dialog";
import type { LeadLostReason } from "@prisma/client";
import type { LeadWithRelations } from "./lead-card";

const SOURCES = [
  "WEBSITE",
  "WHATSAPP",
  "INSTAGRAM",
  "TIKTOK",
  "REFERRAL",
  "EVENT",
  "PAID_ADS",
  "EMAIL",
  "OTHER",
];

export function LeadDrawer({
  open,
  onOpenChange,
  lead,
  campaignOptions,
  users,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadWithRelations | null;
  campaignOptions: { id: string; name: string }[];
  users: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const mode = lead ? "edit" : "create";
  const action = mode === "create" ? createLeadAction : updateLeadAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [comments, setComments] = useState<(Comment & { author: PrismaUser })[]>([]);
  const [timeline, setTimeline] = useState<(ActivityLog & { actor: PrismaUser })[]>([]);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [nextFollowUp, setNextFollowUp] = useState(
    lead?.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 10) : "",
  );
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Reset the follow-up input when the drawer switches to a different lead —
  // an in-render state adjustment (not an effect) so it can't cascade.
  const [syncedLeadId, setSyncedLeadId] = useState(lead?.id);
  if (lead?.id !== syncedLeadId) {
    setSyncedLeadId(lead?.id);
    setNextFollowUp(lead?.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 10) : "");
  }

  useEffect(() => {
    if (state.success) {
      toast.success("Lead saved");
      if (state.warning) toast.warning(state.warning);
      onOpenChange(false);
      router.refresh();
    }
    if (state.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!lead || !open) return;
    listCommentsAction("LEAD", lead.id).then(setComments);
    listLeadTimelineAction(lead.id).then(setTimeline);
  }, [lead, open]);

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0];

  async function commitStatusChange(status: string, lostReason?: LeadLostReason) {
    if (!lead) return;
    const result = await updateLeadStatusAction({ id: lead.id, status, lostReason });
    if (result.error) toast.error(result.error);
    else {
      toast.success("Status updated");
      router.refresh();
    }
  }

  function handleStatusChange(status: string) {
    if (status === "LOST") {
      setLostDialogOpen(true);
      return;
    }
    commitStatusChange(status);
  }

  async function handleSaveFollowUp() {
    if (!lead) return;
    setSavingFollowUp(true);
    const result = await setNextFollowUpAction(lead.id, nextFollowUp || null);
    setSavingFollowUp(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(nextFollowUp ? "Follow-up scheduled" : "Follow-up cleared");
      router.refresh();
    }
  }

  async function handleTouchLastContact() {
    if (!lead) return;
    const result = await touchLastContactAction(lead.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Last contact updated");
      router.refresh();
    }
  }

  async function handleConvert() {
    if (!lead) return;
    const result = await convertToClientAction(lead.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Converted to client");
      router.refresh();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-full sm:data-[side=right]:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "New Lead" : "Edit Lead"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <fieldset disabled={!canEdit} className="space-y-4">
            <form action={formAction} className="space-y-4">
              {lead && <input type="hidden" name="id" value={lead.id} />}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={lead?.name} required />
                {fieldError("name") && (
                  <p className="text-sm text-destructive">{fieldError("name")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" defaultValue={lead?.company ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" name="industry" defaultValue={lead?.industry ?? ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (WhatsApp)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+62812..."
                  defaultValue={lead?.phone ?? ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select name="source" defaultValue={lead?.source ?? "OTHER"}>
                    <SelectTrigger id="source" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="potentialRevenue">Potential revenue (IDR)</Label>
                  <Input
                    id="potentialRevenue"
                    name="potentialRevenue"
                    type="number"
                    min={0}
                    defaultValue={lead?.potentialRevenue?.toString() ?? ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerId">Owner</Label>
                <Select
                  name="ownerId"
                  defaultValue={lead?.ownerId ?? ""}
                  items={{ "": "Unassigned", ...Object.fromEntries(users.map((u) => [u.id, u.name])) }}
                >
                  <SelectTrigger id="ownerId" className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaignId">Campaign attribution</Label>
                <Select
                  name="campaignId"
                  defaultValue={lead?.campaignId ?? ""}
                  items={{
                    "": "No campaign",
                    ...Object.fromEntries(campaignOptions.map((c) => [c.id, c.name])),
                  }}
                >
                  <SelectTrigger id="campaignId" className="w-full">
                    <SelectValue placeholder="No campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No campaign</SelectItem>
                    {campaignOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={lead?.notes ?? ""} rows={3} />
              </div>

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving..." : mode === "create" ? "Create lead" : "Save changes"}
              </Button>
            </form>
          </fieldset>

          {lead && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={lead.status}
                  onValueChange={(v) => handleStatusChange(String(v))}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LEAD_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lead.status === "LOST" && lead.lostReason && (
                  <p className="text-sm text-muted-foreground">
                    Reason: {LEAD_LOST_REASON_LABEL[lead.lostReason]}
                  </p>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                Last contact: {formatDate(lead.lastContactAt)}
              </div>

              {lead.status !== "WON" && lead.status !== "LOST" && (
                <div className="space-y-2">
                  <Label htmlFor="nextFollowUp">Next follow-up</Label>
                  <div className="flex gap-2">
                    <Input
                      id="nextFollowUp"
                      type="date"
                      value={nextFollowUp}
                      onChange={(e) => setNextFollowUp(e.target.value)}
                      disabled={!canEdit}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canEdit || savingFollowUp}
                      onClick={handleSaveFollowUp}
                    >
                      {savingFollowUp ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overrides the default 48h SLA — useful when a school asks you to check back on a
                    specific date instead.
                  </p>
                </div>
              )}

              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  {lead.phone && (
                    <a
                      href={whatsappLink(
                        lead.phone,
                        `Hi ${lead.name}, following up on your inquiry`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      <MessageCircle className="mr-1 h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={handleTouchLastContact}>
                    Mark contacted now
                  </Button>
                  {lead.status === "WON" && !lead.client && (
                    <Button size="sm" onClick={handleConvert}>
                      Convert to Client
                    </Button>
                  )}
                  {lead.client && (
                    <span className="text-sm text-muted-foreground">Already a client</span>
                  )}
                </div>
              )}
            </div>
          )}

          {lead && (
            <div className="space-y-3 border-t pt-4">
              <Label>Timeline</Label>
              <ActivityTimeline entries={timeline} />
            </div>
          )}

          {lead && (
            <div className="space-y-3 border-t pt-4">
              <Label>Comments</Label>
              <CommentThread entityType="LEAD" entityId={lead.id} comments={comments} />
            </div>
          )}
        </div>
      </SheetContent>

      <LostReasonDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        onCancel={() => setLostDialogOpen(false)}
        onConfirm={(reason) => {
          setLostDialogOpen(false);
          commitStatusChange("LOST", reason);
        }}
      />
    </Sheet>
  );
}
