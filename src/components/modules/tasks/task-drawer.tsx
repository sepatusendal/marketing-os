"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { listTaskAssetsAction } from "@/lib/actions/asset";
import { listCommentsAction } from "@/lib/actions/comment";
import { AssetUploader } from "@/components/modules/assets/asset-uploader";
import { AssetGrid } from "@/components/modules/assets/asset-grid";
import { CommentThread } from "@/components/modules/comments/comment-thread";
import type { Asset, Comment, User as PrismaUser, BoardColumn } from "@prisma/client";
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
import { cn } from "@/lib/utils";
import { TASK_LABEL_COLORS, TASK_LABEL_HEX, type TaskLabelColor } from "@/lib/task-labels";
import {
  createTaskAction,
  updateTaskAction,
  updateTaskColumnAction,
  updateTaskLabelsAction,
  createChecklistItemAction,
  toggleChecklistItemAction,
  deleteChecklistItemAction,
  type ActionState,
} from "@/app/(app)/tasks/actions";
import type { TaskWithRelations } from "./task-card";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function toDateInputValue(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function TaskDrawer({
  open,
  onOpenChange,
  task,
  columns,
  campaignOptions,
  users,
  defaultCampaignId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithRelations | null;
  columns: BoardColumn[];
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
  const [newChecklistLabel, setNewChecklistLabel] = useState("");

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

  async function handleColumnChange(columnId: string) {
    if (!task) return;
    const result = await updateTaskColumnAction({ id: task.id, columnId });
    if (result.error) toast.error(result.error);
    else {
      toast.success("Column updated");
      router.refresh();
    }
  }

  async function toggleLabel(color: TaskLabelColor) {
    if (!task) return;
    const next = task.labels.includes(color)
      ? task.labels.filter((l) => l !== color)
      : [...task.labels, color];
    const result = await updateTaskLabelsAction({ id: task.id, labels: next });
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  async function handleAddChecklistItem(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !newChecklistLabel.trim()) return;
    const result = await createChecklistItemAction({
      taskId: task.id,
      label: newChecklistLabel.trim(),
    });
    if (result.error) toast.error(result.error);
    else {
      setNewChecklistLabel("");
      router.refresh();
    }
  }

  async function handleToggleChecklistItem(id: string, isDone: boolean) {
    const result = await toggleChecklistItemAction({ id, isDone });
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  async function handleDeleteChecklistItem(id: string) {
    const result = await deleteChecklistItemAction({ id });
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-full sm:data-[side=right]:max-w-md">
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
              <Label>Column</Label>
              <Select
                defaultValue={task.columnId ?? undefined}
                onValueChange={(v) => handleColumnChange(String(v))}
                items={Object.fromEntries(columns.map((c) => [c.id, c.name]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
          <div className="space-y-2 border-t px-4 pb-4 pt-4">
            <Label>Labels</Label>
            <div className="flex gap-2">
              {TASK_LABEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleLabel(color)}
                  className={cn(
                    "h-6 w-6 rounded-full ring-offset-2 ring-offset-background transition-all",
                    task.labels.includes(color) && "ring-2 ring-foreground",
                  )}
                  style={{ backgroundColor: TASK_LABEL_HEX[color] }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>
        )}

        {task && (
          <div className="space-y-2 border-t px-4 pb-4 pt-4">
            <Label>Checklist</Label>
            <div className="space-y-1.5">
              {task.checklistItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.isDone}
                    onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
                    className="accent-primary"
                  />
                  <span className={cn("flex-1", item.isDone && "text-muted-foreground line-through")}>
                    {item.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddChecklistItem} className="flex gap-2">
              <Input
                value={newChecklistLabel}
                onChange={(e) => setNewChecklistLabel(e.target.value)}
                placeholder="Add checklist item"
                className="h-8"
              />
              <Button type="submit" size="sm" variant="secondary">
                Add
              </Button>
            </form>
          </div>
        )}

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
