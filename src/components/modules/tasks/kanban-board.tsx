"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TaskCard, type TaskWithRelations } from "./task-card";
import { TaskDrawer } from "./task-drawer";
import { updateTaskColumnAction } from "@/app/(app)/tasks/actions";
import type { BoardColumn } from "@prisma/client";

type GroupBy = "none" | "assignee" | "priority" | "campaign";

const GROUP_LABELS: Record<GroupBy, string> = {
  none: "None",
  assignee: "Assignee",
  priority: "Priority",
  campaign: "Campaign",
};

function swimlaneKey(task: TaskWithRelations, groupBy: GroupBy): string {
  if (groupBy === "assignee") return task.assignee?.name ?? "Unassigned";
  if (groupBy === "priority") return task.priority;
  if (groupBy === "campaign") return task.campaign?.name ?? "No campaign";
  return "";
}

export function KanbanBoard({
  tasks,
  columns,
  showCampaign = true,
  campaignOptions,
  users,
  defaultCampaignId,
}: {
  tasks: TaskWithRelations[];
  columns: BoardColumn[];
  showCampaign?: boolean;
  campaignOptions: { id: string; name: string }[];
  users: { id: string; name: string }[];
  defaultCampaignId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Re-derived from the latest `tasks` prop on every server refresh, so an
  // open drawer reflects checklist/label/column edits immediately instead of
  // holding the stale object captured when the card was first clicked.
  const selectedTask = selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId) ?? null) : null;

  const groupBy = (searchParams.get("groupBy") as GroupBy | null) ?? "none";

  function setGroupBy(value: GroupBy) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "none") params.delete("groupBy");
    else params.set("groupBy", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleDrop(columnId: string, taskId: string) {
    setDragOverColumn(null);
    startTransition(async () => {
      const result = await updateTaskColumnAction({ id: taskId, columnId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns],
  );

  const lanes = useMemo(() => {
    if (groupBy === "none") return [{ key: "", label: "" }];
    const keys = new Set(tasks.map((t) => swimlaneKey(t, groupBy)));
    return [...keys].sort().map((key) => ({ key, label: key }));
  }, [tasks, groupBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(GROUP_LABELS) as GroupBy[]).map((g) => (
              <SelectItem key={g} value={g}>
                Group by: {GROUP_LABELS[g]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          onClick={() => {
            setSelectedTaskId(null);
            setDrawerOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New Task
        </Button>
      </div>

      {lanes.map((lane) => {
        const laneTasks =
          groupBy === "none" ? tasks : tasks.filter((t) => swimlaneKey(t, groupBy) === lane.key);

        return (
          <div key={lane.key || "__all__"} className="space-y-2">
            {groupBy !== "none" && (
              <div className="text-sm font-medium text-muted-foreground">{lane.label}</div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sortedColumns.map((col) => {
                const columnTasks = laneTasks.filter((t) => t.columnId === col.id);
                const overWip = col.wipLimit != null && columnTasks.length > col.wipLimit;
                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverColumn(col.id);
                    }}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData("text/plain");
                      if (taskId) handleDrop(col.id, taskId);
                    }}
                    className={cn(
                      "flex min-h-40 flex-col gap-2 rounded-lg border bg-muted/20 p-3",
                      dragOverColumn === col.id && "ring-2 ring-primary",
                      overWip && "ring-1 ring-destructive",
                    )}
                  >
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="flex items-center gap-1.5">
                        {col.color && (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: col.color }}
                          />
                        )}
                        {col.name}
                      </span>
                      <Badge variant={overWip ? "destructive" : "outline"}>
                        {columnTasks.length}
                        {col.wipLimit != null ? ` / ${col.wipLimit}` : ""}
                      </Badge>
                    </div>
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        showCampaign={showCampaign}
                        onOpen={(t) => {
                          setSelectedTaskId(t.id);
                          setDrawerOpen(true);
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <TaskDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        task={selectedTask}
        columns={sortedColumns}
        campaignOptions={campaignOptions}
        users={users}
        defaultCampaignId={defaultCampaignId}
      />
    </div>
  );
}
