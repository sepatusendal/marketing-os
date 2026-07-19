import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import type { KnowledgeType } from "@prisma/client";
import { listKnowledge, listAllTags } from "@/server/knowledge.service";
import { KnowledgeFilters } from "@/components/modules/knowledge/knowledge-filters";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { Plus } from "lucide-react";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const canCreate = authorize(user, "knowledge:edit");

  const [{ articles, nextCursor }, tags] = await Promise.all([
    listKnowledge({
      type: params.type as KnowledgeType | undefined,
      tag: params.tag,
      search: params.search,
      cursor: params.cursor,
    }),
    listAllTags(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Knowledge</h1>
          <p className="text-muted-foreground">SOPs, experiments, and campaign learnings.</p>
        </div>
        {canCreate && (
          <Link href="/knowledge/new" className={cn(buttonVariants(), "inline-flex")}>
            <Plus className="mr-1 h-4 w-4" />
            New Article
          </Link>
        )}
      </div>

      <KnowledgeFilters tags={tags} />

      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No articles match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/knowledge/${a.id}`}
              className="space-y-2 rounded-lg border p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline">{a.type.replaceAll("_", " ")}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(a.updatedAt)}</span>
              </div>
              <div className="font-medium">{a.title}</div>
              <div className="text-xs text-muted-foreground">
                {a.author.name}
                {a.campaign && ` · ${a.campaign.name}`}
              </div>
              {a.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {a.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {nextCursor && (
        <Link
          href={`/knowledge?${new URLSearchParams({ ...params, cursor: nextCursor }).toString()}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Load more →
        </Link>
      )}
    </div>
  );
}
