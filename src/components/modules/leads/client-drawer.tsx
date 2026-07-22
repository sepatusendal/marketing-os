"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle, Mail } from "lucide-react";
import { listCommentsAction } from "@/lib/actions/comment";
import { listClientTimelineAction } from "@/lib/actions/activity";
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
  createClientAction,
  updateClientAction,
  type ActionState,
} from "@/app/(app)/leads/clients/actions";
import { formatDate } from "@/lib/format";
import { CLIENT_STATUS_ORDER, CLIENT_STATUS_LABEL } from "@/lib/client-labels";
import type { ClientWithRelations } from "./client-table";

export function ClientDrawer({
  open,
  onOpenChange,
  client,
  users,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientWithRelations | null;
  users: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const mode = client ? "edit" : "create";
  const action = mode === "create" ? createClientAction : updateClientAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [comments, setComments] = useState<(Comment & { author: PrismaUser })[]>([]);
  const [timeline, setTimeline] = useState<(ActivityLog & { actor: PrismaUser })[]>([]);

  useEffect(() => {
    if (state.success) {
      toast.success("Client saved");
      if (state.warning) toast.warning(state.warning);
      onOpenChange(false);
      router.refresh();
    }
    if (state.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!client || !open) return;
    listCommentsAction("CLIENT", client.id).then(setComments);
    listClientTimelineAction(client.id).then(setTimeline);
  }, [client, open]);

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-full sm:data-[side=right]:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "New Client" : "Edit Client"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <fieldset disabled={!canEdit} className="space-y-4">
            <form action={formAction} className="space-y-4">
              {client && <input type="hidden" name="id" value={client.id} />}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={client?.name} required />
                {fieldError("name") && (
                  <p className="text-sm text-destructive">{fieldError("name")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company / School</Label>
                  <Input id="company" name="company" defaultValue={client?.company ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" name="industry" defaultValue={client?.industry ?? ""} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (WhatsApp)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+62812..."
                    defaultValue={client?.phone ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
                  {fieldError("email") && (
                    <p className="text-sm text-destructive">{fieldError("email")}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={client?.status ?? "ACTIVE"}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {CLIENT_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractValue">Contract value (IDR)</Label>
                  <Input
                    id="contractValue"
                    name="contractValue"
                    type="number"
                    min={0}
                    defaultValue={client?.contractValue?.toString() ?? ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerId">Account owner</Label>
                  <Select
                    name="ownerId"
                    defaultValue={client?.ownerId ?? ""}
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
                  <Label htmlFor="since">Client since</Label>
                  <Input
                    id="since"
                    name="since"
                    type="date"
                    defaultValue={client?.since ? new Date(client.since).toISOString().slice(0, 10) : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} rows={3} />
              </div>

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving..." : mode === "create" ? "Add client" : "Save changes"}
              </Button>
            </form>
          </fieldset>

          {client && canEdit && (client.phone || client.email) && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {client.phone && (
                <a
                  href={whatsappLink(client.phone, `Hi ${client.name}, `)}
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
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Mail className="mr-1 h-3.5 w-3.5" />
                  Email
                </a>
              )}
            </div>
          )}

          {client?.lead && (
            <p className="border-t pt-4 text-sm text-muted-foreground">
              Converted from lead — owner at conversion time:{" "}
              {client.lead.owner?.name ?? "Unassigned"}
              {client.lead.campaign ? ` · ${client.lead.campaign.name}` : ""}
            </p>
          )}

          {client && (
            <div className="space-y-3 border-t pt-4">
              <Label>Timeline</Label>
              <ActivityTimeline entries={timeline} />
            </div>
          )}

          {client && (
            <div className="space-y-3 border-t pt-4">
              <Label>Comments</Label>
              <CommentThread entityType="CLIENT" entityId={client.id} comments={comments} />
            </div>
          )}

          {client && (
            <p className="border-t pt-4 text-xs text-muted-foreground">
              Client since {formatDate(client.since)}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
