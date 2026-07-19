import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Dev-only seed. Never run against prod (PRD §12.6).
 * Full seed data (users per role, campaigns, tasks, leads, expenses,
 * knowledge articles per Appendix B) is built out in Phase 8.
 */
async function main() {
  console.log("Seed script placeholder — full dataset lands in Phase 8.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
