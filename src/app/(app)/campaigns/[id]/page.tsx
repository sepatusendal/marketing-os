import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { getCampaign, listCampaignOptions } from "@/server/campaign.service";
import { listActiveUsers } from "@/server/user.service";
import { listCampaignTimeline } from "@/server/activity.service";
import { listTasksForCampaign } from "@/server/task.service";
import { listExpenses, categoryBreakdown } from "@/server/expense.service";
import { listAssetsForCampaign, getSignedDownloadUrl } from "@/server/asset.service";
import { getAllowedTransitions } from "@/lib/campaign-status";
import { AssetUploader } from "@/components/modules/assets/asset-uploader";
import { AssetGrid } from "@/components/modules/assets/asset-grid";
import { listCommentsForEntity } from "@/server/comment.service";
import { listKnowledgeForCampaign } from "@/server/knowledge.service";
import { CommentThread } from "@/components/modules/comments/comment-thread";
import { CampaignForm } from "@/components/modules/campaigns/campaign-form";
import { StatusControl } from "@/components/modules/campaigns/status-control";
import { CampaignTimeline } from "@/components/modules/campaigns/campaign-timeline";
import { PriorityBadge } from "@/components/modules/campaigns/status-badge";
import { KanbanBoard } from "@/components/modules/tasks/kanban-board";
import { ExpenseHistoryTable } from "@/components/modules/budget/expense-history-table";
import { CategoryBreakdown } from "@/components/modules/budget/category-breakdown";
import { AddExpenseDialog } from "@/components/modules/budget/add-expense-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatIDR, formatDate } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const [users, activity, tasks, campaignOptions, expenses, breakdown, assets, comments, articles] =
    await Promise.all([
      listActiveUsers(),
      listCampaignTimeline(id),
      listTasksForCampaign(id),
      listCampaignOptions(),
      listExpenses({ campaignId: id }),
      categoryBreakdown(id),
      listAssetsForCampaign(id),
      listCommentsForEntity("CAMPAIGN", id),
      listKnowledgeForCampaign(id),
    ]);

  // PRD §6.2 note: DESIGNER only sees campaigns that have a task assigned to
  // them — block direct-URL access to campaigns outside that scope.
  if (user.role === Role.DESIGNER && !tasks.some((t) => t.assigneeId === user.id)) {
    notFound();
  }

  const assetsWithUrls = await Promise.all(
    assets.map(async (a) => ({ ...a, url: await getSignedDownloadUrl(a.storagePath) })),
  );

  const canEdit = authorize(user, "campaign:edit_own", { ownerId: campaign.ownerId });
  const canEditExpense = authorize(user, "expense:edit");
  const canUnarchive = user.role === Role.OWNER || user.role === Role.ADMIN;
  const allowedTransitions = getAllowedTransitions(campaign.status, canUnarchive);
  const isOverAllocated = campaign.budgetUsed > Number(campaign.budgetAllocated);

  const budgetPercent = Number(campaign.budgetAllocated) > 0
    ? Math.min(100, Math.round((campaign.budgetUsed / Number(campaign.budgetAllocated)) * 100))
    : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {campaign.name}
              </h1>
              <PriorityBadge priority={campaign.priority} />
            </div>
            {campaign.department && (
              <p className="mt-0.5 text-muted-foreground">{campaign.department}</p>
            )}
          </div>
          <StatusControl
            campaignId={campaign.id}
            status={campaign.status}
            allowedTransitions={canEdit ? allowedTransitions : []}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {initials(campaign.owner.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Owner</p>
              <p className="truncate text-sm font-medium">{campaign.owner.name}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Dates</p>
            <p className="text-sm font-medium">
              {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Budget</p>
              {isOverAllocated && (
                <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                  Over budget
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium tabular-nums">
              {formatIDR(campaign.budgetUsed)}
              <span className="text-muted-foreground">
                {" "}
                / {formatIDR(campaign.budgetAllocated.toString())}
              </span>
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isOverAllocated ? "bg-destructive" : "bg-primary",
                )}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          {canEdit ? (
            <CampaignForm
              mode="edit"
              users={users}
              campaign={{ ...campaign, budgetAllocated: campaign.budgetAllocated.toString() }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have permission to edit this campaign.
            </p>
          )}

          {articles.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium">Linked Knowledge Articles</h3>
              <ul className="space-y-1">
                {articles.map((a) => (
                  <li key={a.id}>
                    <Link href={`/knowledge/${a.id}`} className="text-sm hover:underline">
                      {a.title}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {a.type.replaceAll("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          <CampaignTimeline entries={activity} />
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <KanbanBoard
            tasks={tasks}
            showCampaign={false}
            campaignOptions={campaignOptions}
            users={users}
            defaultCampaignId={campaign.id}
          />
        </TabsContent>

        <TabsContent value="budget" className="space-y-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {formatIDR(campaign.budgetUsed)} used of{" "}
              {formatIDR(campaign.budgetAllocated.toString())} allocated
            </div>
            {canEditExpense && (
              <AddExpenseDialog campaignOptions={campaignOptions} defaultCampaignId={campaign.id} />
            )}
          </div>
          <CategoryBreakdown breakdown={breakdown} />
          <ExpenseHistoryTable expenses={expenses} showCampaign={false} />
        </TabsContent>

        <TabsContent value="analytics" className="pt-4">
          <p className="text-sm text-muted-foreground">
            KPI/budget-burn visuals land alongside Leads (Phase 4/6).
          </p>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <AssetUploader scope="campaigns" scopeId={campaign.id} />
          </div>
          <AssetGrid assets={assetsWithUrls} />
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          <CommentThread
            entityType="CAMPAIGN"
            entityId={campaign.id}
            comments={comments}
            revalidatePath={`/campaigns/${campaign.id}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
