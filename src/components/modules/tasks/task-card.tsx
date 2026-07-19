"use client";

import { PriorityBadge } from "@/components/modules/campaigns/status-badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task, User, Campaign } from "@prisma/client";

export type TaskWithRelations = Task & {
  assignee: User | null;
  campaign: Pick<Campaign, "id" | "name"> | null;
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
    task.dueDate && task.status !== "COMPLETED" && new Date(task.dueDate) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
      }}
      onClick={() => onOpen(task)}
      className="cursor-grab space-y-2 rounded-md border bg-card p-3 text-sm shadow-sm active:cursor-grabbing"
    >
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
      {task.dueDate && (
        <div className={cn("text-xs", isOverdue ? "font-medium text-destructive" : "text-muted-foreground")}>
          {isOverdue ? "Overdue: " : "Due "}
          {formatDate(task.dueDate)}
        </div>
      )}
    </div>
  );
}
