import Link from "next/link";
import { WidgetCard } from "./widget-card";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task, Campaign } from "@prisma/client";

export function TodaysTasksWidget({
  tasks,
}: {
  tasks: (Task & { campaign: Pick<Campaign, "id" | "name"> | null })[];
}) {
  return (
    <WidgetCard title={`Today's Tasks (${tasks.length})`}>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing due today. Nice.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
            return (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <Link href="/tasks" className="hover:underline">
                  {t.title}
                </Link>
                <span
                  className={cn(
                    "text-xs",
                    isOverdue ? "font-medium text-destructive" : "text-muted-foreground",
                  )}
                >
                  {t.campaign?.name ?? "Standalone"} · {formatDate(t.dueDate)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
