import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getKnowledgeArticle } from "@/server/knowledge.service";
import { listCampaignOptions } from "@/server/campaign.service";
import { KnowledgeForm } from "@/components/modules/knowledge/knowledge-form";
import { MarkdownRenderer } from "@/components/modules/knowledge/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

const MANAGER_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER];

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const article = await getKnowledgeArticle(id);
  if (!article) notFound();

  const canEdit = article.authorId === user.id || MANAGER_ROLES.includes(user.role);
  const campaignOptions = await listCampaignOptions();

  if (canEdit) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">Edit Article</h1>
        <KnowledgeForm
          mode="edit"
          article={{
            id: article.id,
            title: article.title,
            type: article.type,
            body: article.body,
            campaignId: article.campaignId,
            tags: article.tags,
          }}
          campaignOptions={campaignOptions}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{article.type.replaceAll("_", " ")}</Badge>
        <span className="text-xs text-muted-foreground">
          {article.author.name} · {formatDate(article.updatedAt)}
        </span>
      </div>
      <h1 className="text-2xl font-semibold">{article.title}</h1>
      {article.campaign && (
        <Link
          href={`/campaigns/${article.campaign.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          {article.campaign.name}
        </Link>
      )}
      <MarkdownRenderer content={article.body} />
    </div>
  );
}
