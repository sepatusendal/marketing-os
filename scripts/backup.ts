/**
 * Local manual backup: dumps every table to a timestamped JSON file under
 * backups/. Mirrors src/app/api/backup/export/route.ts (same tables, same
 * shape) but runs from the command line via Prisma directly instead of
 * going through the app's auth — useful for a quick local snapshot, or for
 * backing up prod without deploying/opening the app.
 *
 * Usage:
 *   npm run backup                                     # uses DATABASE_URL from .env (dev)
 *   BACKUP_DATABASE_URL="<prod direct url>" npm run backup   # backs up prod instead
 *
 * Pass BACKUP_DATABASE_URL rather than editing .env so a prod backup never
 * risks leaving your local .env accidentally pointed at prod afterward.
 * Use the DIRECT (port 5432, no pgbouncer) connection string here, not the
 * pooled one — this is a single one-off script run, not a long-lived app.
 */
import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const databaseUrl = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("No DATABASE_URL or BACKUP_DATABASE_URL set.");
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

async function main() {
  console.log("Connecting and exporting all tables...");

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
    exportedBy: "local-script",
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

  const dir = join(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });
  const filename = `marketingos-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filepath = join(dir, filename);
  writeFileSync(filepath, JSON.stringify(payload, null, 2));

  console.log(`Backup written to ${filepath}`);
  console.log(
    `Tables: ${Object.entries(payload.data)
      .map(([k, v]) => `${k}=${v.length}`)
      .join(", ")}`,
  );
}

main()
  .catch((err) => {
    console.error("Backup failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
