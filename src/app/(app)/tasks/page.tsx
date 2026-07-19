import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Role, type TaskStatus } from "@prisma/client";
import { listMyTasks, listAllTasks } from "@/server/task.service";
import { listCampaignOptions } from "@/server/campaign.service";
import { listActiveUsers } from "@/server/user.service";
import { KanbanBoard } from "@/components/modules/tasks/kanban-board";
import { TaskFilters } from "@/components/modules/tasks/task-filters";
import { cn } from "@/lib/utils";

const MANAGER_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const canViewAll = MANAGER_ROLES.includes(user.role);
  const view = params.view === "all" && canViewAll ? "all" : "mine";

  const [tasks, campaignOptions, users] = await Promise.all([
    view === "all"
      ? listAllTasks({
          campaignId: params.campaignId,
          assigneeId: params.assigneeId,
          status: params.status as TaskStatus | undefined,
        })
      : listMyTasks(user.id),
    listCampaignOptions(),
    listActiveUsers(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-muted-foreground">
          {view === "mine" ? "Tasks assigned to you." : "All tasks across every campaign."}
        </p>
      </div>

      {canViewAll && (
        <div className="flex gap-1 border-b">
          <Link
            href="/tasks"
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              view === "mine"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            My Tasks
          </Link>
          <Link
            href="/tasks?view=all"
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              view === "all"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            All Tasks
          </Link>
        </div>
      )}

      {view === "all" && (
        <TaskFilters campaignOptions={campaignOptions} users={users} />
      )}

      <KanbanBoard
        tasks={tasks}
        showCampaign={view === "all"}
        campaignOptions={campaignOptions}
        users={users}
      />
    </div>
  );
}
