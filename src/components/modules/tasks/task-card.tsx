"use client";

import { ImageIcon, ListChecks } from "lucide-react";
import { PriorityBadge } from "@/components/modules/campaigns/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TASK_LABEL_HEX, type TaskLabelColor } from "@/lib/task-labels";
import { jakartaEndOfDay } from "@/lib/jakarta-time";
import { ACCENT_BORDER, ACCENT_WASH, PRIORITY_ACCENT } from "@/lib/accent-colors";
import type { Task, User, Campaign, BoardColumn, TaskChecklistItem, Asset } from "@prisma/client";

export type TaskWithRelations = Task & {
  assignee: User | null;
  campaign: Pick<Campaign, "id" | "name"> | null;
  column: BoardColumn | null;
  checklistItems: TaskChecklistItem[];
  assets: Asset[]; // cover: first image attachment, if any
};

export function TaskCard({
  task,
  showCampaign = true,
  onOpen,
}: {
  task: TaskWithRelations;
  showCampaign?: boolean;
  onOpen: (task: TaskWithRelations) => void;
}) {
  const isOverdue =
    task.dueDate &&
    task.status !== "COMPLETED" &&
    jakartaEndOfDay(new Date(task.dueDate)) < new Date();
  const doneCount = task.checklistItems.filter((i) => i.isDone).length;
  const accent = PRIORITY_ACCENT[task.priority];

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
      }}
      onClick={() => onOpen(task)}
      className={cn(
        "cursor-grab space-y-2 rounded-md border border-l-2 bg-card p-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing active:translate-y-0",
        ACCENT_BORDER[accent],
        ACCENT_WASH[accent],
      )}
    >
      {task.labels.length > 0 && (
        <div className="flex gap-1">
          {task.labels.map((label) => (
            <span
              key={label}
              className="h-2 w-6 rounded-full"
              style={{ backgroundColor: TASK_LABEL_HEX[label as TaskLabelColor] }}
            />
          ))}
        </div>
      )}
      <div className="font-medium">{task.title}</div>
      {showCampaign && task.campaign && (
        <div className="text-xs text-muted-foreground">{task.campaign.name}</div>
      )}
      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        {task.assignee && (
          <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
        )}
      </div>
      {(task.assets.length > 0 || task.checklistItems.length > 0) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.assets.length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" /> {task.assets.length}
            </span>
          )}
          {task.checklistItems.length > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              {doneCount}/{task.checklistItems.length}
            </span>
          )}
        </div>
      )}
      {task.dueDate && (
        <div className={cn("text-xs", isOverdue ? "font-medium text-destructive" : "text-muted-foreground")}>
          {isOverdue ? "Overdue: " : "Due "}
          {formatDate(task.dueDate)}
        </div>
      )}
    </div>
  );
}
