"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { listCommentsAction } from "@/lib/actions/comment";
import { CommentThread } from "@/components/modules/comments/comment-thread";
import type { Comment, User as PrismaUser } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  convertToClientAction,
  type ActionState,
} from "@/app/(app)/leads/actions";
import { formatDate } from "@/lib/format";
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
const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "WON", "LOST"];

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
  }, [lead, open]);

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0];

  async function handleStatusChange(status: string) {
    if (!lead) return;
    const result = await updateLeadStatusAction({ id: lead.id, status });
    if (result.error) toast.error(result.error);
    else {
      toast.success("Status updated");
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
                  defaultValue={lead.status}
                  onValueChange={(v) => handleStatusChange(String(v))}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                Last contact: {formatDate(lead.lastContactAt)}
              </div>

              {canEdit && (
                <div className="flex flex-wrap gap-2">
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
              <Label>Comments</Label>
              <CommentThread entityType="LEAD" entityId={lead.id} comments={comments} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
