import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

/**
 * Full-data JSON export for backup purposes — OWNER/ADMIN only, since it
 * dumps every table including other users' records. Not a restore path:
 * re-importing this file isn't supported, it's a safety-net snapshot.
 */
export async function GET() {
  const user = await requireUser();
  if (!authorize(user, "settings:manage")) {
    return new Response("Forbidden", { status: 403 });
  }

  const [
    users,
    campaigns,
    tasks,
    leads,
    clients,
    expenses,
    assets,
    knowledgeArticles,
    comments,
    activityLog,
    notifications,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.campaign.findMany(),
    prisma.task.findMany(),
    prisma.lead.findMany(),
    prisma.client.findMany(),
    prisma.expense.findMany(),
    prisma.asset.findMany(),
    prisma.knowledgeArticle.findMany(),
    prisma.comment.findMany(),
    prisma.activityLog.findMany(),
    prisma.notification.findMany(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: user.id,
    version: 1,
    data: {
      users,
      campaigns,
      tasks,
      leads,
      clients,
      expenses,
      assets,
      knowledgeArticles,
      comments,
      activityLog,
      notifications,
    },
  };

  const json = JSON.stringify(
    payload,
    (_key, value) => (typeof value === "object" && value !== null && "toFixed" in value ? value.toString() : value),
    2,
  );

  const filename = `marketingos-backup-${new Date().toISOString().slice(0, 10)}.json`;
  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
