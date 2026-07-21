"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WIDGET_ACCENT, ACCENT_CHIP, PRIORITY_ACCENT } from "@/lib/accent-colors";
import { updateTaskColumnAction } from "@/app/(app)/tasks/actions";
import type { Task, BoardColumn } from "@prisma/client";

function dueLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return `${formatDate(date)} (overdue)`;
  return formatDate(date);
}

export function UpcomingTasksWidget({
  tasks,
  completedColumnId,
}: {
  tasks: (Task & { campaign: { id: string; name: string } | null })[];
  completedColumnId: BoardColumn["id"] | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [completing, setCompleting] = useState<string | null>(null);

  function handleComplete(taskId: string) {
    if (!completedColumnId) return;
    setCompleting(taskId);
    startTransition(async () => {
      const result = await updateTaskColumnAction({ id: taskId, columnId: completedColumnId });
      if (result.error) {
        toast.error(result.error);
        setCompleting(null);
      } else {
        toast.success("Task completed");
        router.refresh();
      }
    });
  }

  return (
    <WidgetCard title={`Upcoming Tasks (${tasks.length})`} accent={WIDGET_ACCENT.tasks} icon={ListChecks}>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing on the horizon. Nice.</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((t) => {
            const accent = PRIORITY_ACCENT[t.priority];
            const isCompleting = completing === t.id;
            return (
              <li
                key={t.id}
                className="group flex items-center gap-3 rounded-lg p-1.5 text-sm transition-colors hover:bg-muted"
              >
                <button
                  type="button"
                  onClick={() => handleComplete(t.id)}
                  disabled={isCompleting || !completedColumnId}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-emerald-500 disabled:opacity-50"
                  aria-label="Mark task complete"
                >
                  {isCompleting ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold", ACCENT_CHIP[accent])}>
                  {t.priority[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-foreground">{t.title}</p>
                  {t.campaign && <p className="truncate text-xs text-muted-foreground">{t.campaign.name}</p>}
                </div>
                {t.dueDate && (
                  <span className="shrink-0 text-xs text-muted-foreground">{dueLabel(t.dueDate)}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
