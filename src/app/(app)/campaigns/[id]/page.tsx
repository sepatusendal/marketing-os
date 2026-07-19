import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { getCampaign } from "@/server/campaign.service";
import { listActiveUsers } from "@/server/user.service";
import { listActivityForEntity } from "@/server/activity.service";
import { getAllowedTransitions } from "@/lib/campaign-status";
import { CampaignForm } from "@/components/modules/campaigns/campaign-form";
import { StatusControl } from "@/components/modules/campaigns/status-control";
import { CampaignTimeline } from "@/components/modules/campaigns/campaign-timeline";
import { PriorityBadge } from "@/components/modules/campaigns/status-badge";
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

  const [users, activity] = await Promise.all([
    listActiveUsers(),
    listActivityForEntity("CAMPAIGN", id),
  ]);

  const canEdit = authorize(user, "campaign:edit_own", { ownerId: campaign.ownerId });
  const canUnarchive = user.role === Role.OWNER || user.role === Role.ADMIN;
  const allowedTransitions = getAllowedTransitions(campaign.status, canUnarchive);

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
          <p className="text-sm text-muted-foreground">
            Campaign-scoped task kanban lands in Phase 2.
          </p>
        </TabsContent>

        <TabsContent value="budget" className="pt-4">
          <p className="text-sm text-muted-foreground">
            Expense tracking and budget breakdown land in Phase 3.
          </p>
        </TabsContent>

        <TabsContent value="analytics" className="pt-4">
          <p className="text-sm text-muted-foreground">
            KPI/budget-burn visuals land alongside Budget and Leads (Phase 3–4).
          </p>
        </TabsContent>

        <TabsContent value="assets" className="pt-4">
          <p className="text-sm text-muted-foreground">
            File uploads and previews land in Phase 5.
          </p>
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          <p className="text-sm text-muted-foreground">
            Comment thread lands in Phase 5.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
