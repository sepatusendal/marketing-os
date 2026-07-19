"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { Role } from "@prisma/client";

const MANAGER_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER];
const RESULT_LIMIT = 5;

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  group: "Campaigns" | "Tasks" | "Leads" | "Knowledge";
};

/**
 * Cross-entity search for the Cmd+K palette. Mirrors the same visibility
 * rules as each module's list page rather than a separate ad-hoc check, so
 * search never surfaces something a user couldn't otherwise navigate to.
 */
export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  const user = await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];

  const isDesigner = user.role === Role.DESIGNER;
  const canViewAllTasks = MANAGER_ROLES.includes(user.role);

  const [campaigns, tasks, leads, knowledge] = await Promise.all([
    prisma.campaign.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
        ...(isDesigner ? { tasks: { some: { assigneeId: user.id } } } : {}),
      },
      select: { id: true, name: true, status: true },
      take: RESULT_LIMIT,
    }),
    prisma.task.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        ...(canViewAllTasks ? {} : { assigneeId: user.id }),
      },
      select: { id: true, title: true, campaign: { select: { name: true } } },
      take: RESULT_LIMIT,
    }),
    authorize(user, "lead:view")
      ? prisma.lead.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, company: true },
          take: RESULT_LIMIT,
        })
      : Promise.resolve([]),
    prisma.knowledgeArticle.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { id: true, title: true, type: true },
      take: RESULT_LIMIT,
    }),
  ]);

  return [
    ...campaigns.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.status,
      href: `/campaigns/${c.id}`,
      group: "Campaigns" as const,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.campaign?.name,
      href: canViewAllTasks ? "/tasks?view=all" : "/tasks",
      group: "Tasks" as const,
    })),
    ...leads.map((l) => ({
      id: l.id,
      title: l.name,
      subtitle: l.company ?? undefined,
      href: `/leads?view=table&search=${encodeURIComponent(l.name)}`,
      group: "Leads" as const,
    })),
    ...knowledge.map((k) => ({
      id: k.id,
      title: k.title,
      subtitle: k.type.replaceAll("_", " "),
      href: `/knowledge/${k.id}`,
      group: "Knowledge" as const,
    })),
  ];
}
