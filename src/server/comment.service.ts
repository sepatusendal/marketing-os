import { prisma } from "@/lib/prisma";
import type { EntityType } from "@prisma/client";

export async function listCommentsForEntity(entityType: EntityType, entityId: string) {
  return prisma.comment.findMany({
    where: { entityType, entityId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Simple @name mention parsing (PRD §9.9): matches @token against active
 * users' names with whitespace stripped, e.g. "@wiraraja" or "@budisantoso".
 */
export async function parseMentions(body: string) {
  const tokens = [...body.matchAll(/@([a-zA-Z0-9_]+)/g)].map((m) => m[1].toLowerCase());
  if (tokens.length === 0) return [];

  const users = await prisma.user.findMany({ where: { isActive: true } });
  return users.filter((u) => tokens.includes(u.name.replace(/\s+/g, "").toLowerCase()));
}

export async function createComment(input: {
  entityType: EntityType;
  entityId: string;
  authorId: string;
  body: string;
}) {
  return prisma.comment.create({
    data: input,
    include: { author: true },
  });
}
