"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskCard, type TaskWithRelations } from "./task-card";
import { TaskDrawer } from "./task-drawer";
import { updateTaskStatusAction } from "@/app/(app)/tasks/actions";
import type { TaskStatus } from "@prisma/client";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "REVIEW", label: "Review" },
  { status: "COMPLETED", label: "Completed" },
];

export function KanbanBoard({
  tasks,
  showCampaign = true,
  campaignOptions,
  users,
  defaultCampaignId,
}: {
  tasks: TaskWithRelations[];
  showCampaign?: boolean;
  campaignOptions: { id: string; name: string }[];
  users: { id: string; name: string }[];
  defaultCampaignId?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleDrop(status: TaskStatus, taskId: string) {
    setDragOverColumn(null);
    startTransition(async () => {
      const result = await updateTaskStatusAction({ id: taskId, status });
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
        <Button
          size="sm"
          onClick={() => {
            setSelectedTask(null);
            setDrawerOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
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
                const taskId = e.dataTransfer.getData("text/plain");
                if (taskId) handleDrop(col.status, taskId);
              }}
              className={cn(
                "flex min-h-40 flex-col gap-2 rounded-lg border bg-muted/20 p-3",
                dragOverColumn === col.status && "ring-2 ring-primary",
              )}
            >
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{col.label}</span>
                <span className="text-muted-foreground">{columnTasks.length}</span>
              </div>
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  showCampaign={showCampaign}
                  onOpen={(t) => {
                    setSelectedTask(t);
                    setDrawerOpen(true);
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>

      <TaskDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        task={selectedTask}
        campaignOptions={campaignOptions}
        users={users}
        defaultCampaignId={defaultCampaignId}
      />
    </div>
  );
}
