import { prisma } from "@/lib/prisma";
import type { Prisma, KnowledgeType } from "@prisma/client";
import type { CreateKnowledgeInput, UpdateKnowledgeInput } from "@/lib/schemas/knowledge";

function parseTags(tags?: string) {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export type KnowledgeListFilters = {
  type?: KnowledgeType;
  tag?: string;
  search?: string;
};

export async function listKnowledge(filters: KnowledgeListFilters = {}) {
  const where: Prisma.KnowledgeArticleWhereInput = {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { body: { contains: filters.search, mode: "insensitive" } },
            { tags: { has: filters.search } },
          ],
        }
      : {}),
  };

  return prisma.knowledgeArticle.findMany({
    where,
    include: { author: true, campaign: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getKnowledgeArticle(id: string) {
  return prisma.knowledgeArticle.findUnique({
    where: { id },
    include: { author: true, campaign: { select: { id: true, name: true } } },
  });
}

export async function listKnowledgeForCampaign(campaignId: string) {
  return prisma.knowledgeArticle.findMany({
    where: { campaignId },
    include: { author: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listAllTags() {
  const rows = await prisma.knowledgeArticle.findMany({ select: { tags: true } });
  const tags = new Set<string>();
  for (const r of rows) for (const t of r.tags) tags.add(t);
  return [...tags].sort();
}

export async function createKnowledgeArticle(input: CreateKnowledgeInput, authorId: string) {
  return prisma.knowledgeArticle.create({
    data: {
      title: input.title,
      type: input.type,
      body: input.body,
      campaignId: input.campaignId || null,
      tags: parseTags(input.tags),
      authorId,
    },
  });
}

export async function updateKnowledgeArticle(input: UpdateKnowledgeInput) {
  return prisma.knowledgeArticle.update({
    where: { id: input.id },
    data: {
      title: input.title,
      type: input.type,
      body: input.body,
      campaignId: input.campaignId || null,
      tags: parseTags(input.tags),
    },
  });
}
