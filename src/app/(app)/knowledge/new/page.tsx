import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { listCampaignOptions } from "@/server/campaign.service";
import { KnowledgeForm } from "@/components/modules/knowledge/knowledge-form";

export default async function NewKnowledgeArticlePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  if (!authorize(user, "knowledge:edit")) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">New Article</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to create knowledge articles.
        </p>
      </div>
    );
  }

  const campaignOptions = await listCampaignOptions();

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">New Article</h1>
      <KnowledgeForm
        mode="create"
        campaignOptions={campaignOptions}
        defaultCampaignId={params.campaignId}
        defaultType={params.type}
      />
    </div>
  );
}
