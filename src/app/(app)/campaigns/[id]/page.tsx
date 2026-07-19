import { notFound } from "next/navigation";
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
import { formatIDR } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const [users, activity, tasks, campaignOptions, expenses, breakdown, assets, comments] =
    await Promise.all([
      listActiveUsers(),
      listCampaignTimeline(id),
      listTasksForCampaign(id),
      listCampaignOptions(),
      listExpenses({ campaignId: id }),
      categoryBreakdown(id),
      listAssetsForCampaign(id),
      listCommentsForEntity("CAMPAIGN", id),
    ]);

  const assetsWithUrls = await Promise.all(
    assets.map(async (a) => ({ ...a, url: await getSignedDownloadUrl(a.storagePath) })),
  );

  const canEdit = authorize(user, "campaign:edit_own", { ownerId: campaign.ownerId });
  const canEditExpense = authorize(user, "expense:edit");
  const canUnarchive = user.role === Role.OWNER || user.role === Role.ADMIN;
  const allowedTransitions = getAllowedTransitions(campaign.status, canUnarchive);
  const isOverAllocated = campaign.budgetUsed > Number(campaign.budgetAllocated);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{campaign.name}</h1>
            <PriorityBadge priority={campaign.priority} />
          </div>
          {campaign.department && (
            <p className="text-muted-foreground">{campaign.department}</p>
          )}
        </div>
        <StatusControl
          campaignId={campaign.id}
          status={campaign.status}
          allowedTransitions={canEdit ? allowedTransitions : []}
        />
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Owner: {campaign.owner.name}</span>
        <span>
          Budget: {formatIDR(campaign.budgetUsed)} / {formatIDR(campaign.budgetAllocated.toString())}
        </span>
        {isOverAllocated && <Badge variant="destructive">Over budget</Badge>}
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
          <div className="flex items-center justify-between">
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
