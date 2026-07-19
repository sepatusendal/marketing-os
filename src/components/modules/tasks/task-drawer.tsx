"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { listTaskAssetsAction } from "@/lib/actions/asset";
import { listCommentsAction } from "@/lib/actions/comment";
import { AssetUploader } from "@/components/modules/assets/asset-uploader";
import { AssetGrid } from "@/components/modules/assets/asset-grid";
import { CommentThread } from "@/components/modules/comments/comment-thread";
import type { Asset, Comment, User as PrismaUser } from "@prisma/client";
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
  createTaskAction,
  updateTaskAction,
  updateTaskStatusAction,
  type ActionState,
} from "@/app/(app)/tasks/actions";
import type { TaskWithRelations } from "./task-card";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];

function toDateInputValue(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function TaskDrawer({
  open,
  onOpenChange,
  task,
  campaignOptions,
  users,
  defaultCampaignId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithRelations | null;
  campaignOptions: { id: string; name: string }[];
  users: { id: string; name: string }[];
  defaultCampaignId?: string;
}) {
  const router = useRouter();
  const mode = task ? "edit" : "create";
  const action = mode === "create" ? createTaskAction : updateTaskAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const [assets, setAssets] = useState<(Asset & { uploader: PrismaUser; url: string })[]>([]);
  const [comments, setComments] = useState<(Comment & { author: PrismaUser })[]>([]);

  useEffect(() => {
    if (state.success) {
      toast.success("Task saved");
      onOpenChange(false);
      router.refresh();
    }
    if (state.error) toast.error(state.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!task || !open) return;
    listTaskAssetsAction(task.id).then(setAssets);
    listCommentsAction("TASK", task.id).then(setComments);
  }, [task, open]);

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0];

  async function handleStatusChange(status: string) {
    if (!task) return;
    const result = await updateTaskStatusAction({ id: task.id, status });
    if (result.error) toast.error(result.error);
    else {
      toast.success("Status updated");
      router.refresh();
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === "create" ? "New Task" : "Edit Task"}</SheetTitle>
        </SheetHeader>

        <form action={formAction} className="space-y-4 px-4 pb-4">
          {task && <input type="hidden" name="id" value={task.id} />}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={task?.title} required />
            {fieldError("title") && (
              <p className="text-sm text-destructive">{fieldError("title")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={task?.description ?? ""}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaignId">Campaign</Label>
            <Select
              name="campaignId"
              defaultValue={task?.campaignId ?? defaultCampaignId ?? ""}
              items={{
                "": "No campaign (standalone)",
                ...Object.fromEntries(campaignOptions.map((c) => [c.id, c.name])),
              }}
            >
              <SelectTrigger id="campaignId" className="w-full">
                <SelectValue placeholder="No campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No campaign (standalone)</SelectItem>
                {campaignOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select
                name="assigneeId"
                defaultValue={task?.assigneeId ?? ""}
                items={{
                  "": "Unassigned",
                  ...Object.fromEntries(users.map((u) => [u.id, u.name])),
                }}
              >
                <SelectTrigger id="assigneeId" className="w-full">
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
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={toDateInputValue(task?.dueDate ?? null)}
            />
          </div>

          {task && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue={task.status} onValueChange={(v) => handleStatusChange(String(v))}>
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
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving..." : mode === "create" ? "Create task" : "Save changes"}
          </Button>
        </form>

        {task && (
          <div className="space-y-3 border-t px-4 pb-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>Attachments</Label>
              <AssetUploader
                scope="tasks"
                scopeId={task.id}
                onUploaded={() => listTaskAssetsAction(task.id).then(setAssets)}
              />
            </div>
            <AssetGrid assets={assets} />
          </div>
        )}

        {task && (
          <div className="space-y-3 border-t px-4 pb-4 pt-4">
            <Label>Comments</Label>
            <CommentThread entityType="TASK" entityId={task.id} comments={comments} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
