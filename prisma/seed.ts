import { PrismaClient, Role } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

/**
 * Dev-only seed. Never run against prod (PRD §12.6).
 *
 * Seed users get random UUIDs, not real Supabase Auth accounts, so they
 * can't log in — they exist only to populate owner/assignee columns so the
 * app looks realistic in demos and screenshots. Whoever runs this locally
 * should already have their own real account (synced on first login) which
 * this script leaves untouched.
 */

function uid() {
  return randomUUID();
}

async function main() {
  const existing = await prisma.campaign.findFirst({
    where: { name: "PPDB 2027 Early Bird" },
  });
  if (existing) {
    console.log("Seed data already present (found 'PPDB 2027 Early Bird'), skipping.");
    return;
  }

  // ---- Users: 1 OWNER, 1 ADMIN, one per remaining role ----
  const owner = await prisma.user.create({
    data: {
      id: uid(),
      email: "siti.owner@marketingos.demo",
      name: "Siti Rahayu",
      role: Role.OWNER,
      department: "Leadership",
    },
  });
  const admin = await prisma.user.create({
    data: {
      id: uid(),
      email: "budi.admin@marketingos.demo",
      name: "Budi Santoso",
      role: Role.ADMIN,
      department: "Operations",
    },
  });
  const manager = await prisma.user.create({
    data: {
      id: uid(),
      email: "dewi.manager@marketingos.demo",
      name: "Dewi Lestari",
      role: Role.MANAGER,
      department: "Marketing",
    },
  });
  const marketing = await prisma.user.create({
    data: {
      id: uid(),
      email: "agus.marketing@marketingos.demo",
      name: "Agus Wijaya",
      role: Role.MARKETING,
      department: "Marketing",
    },
  });
  const crm = await prisma.user.create({
    data: {
      id: uid(),
      email: "rina.crm@marketingos.demo",
      name: "Rina Kartika",
      role: Role.CRM,
      department: "Sales",
    },
  });
  const finance = await prisma.user.create({
    data: {
      id: uid(),
      email: "hendra.finance@marketingos.demo",
      name: "Hendra Gunawan",
      role: Role.FINANCE,
      department: "Finance",
    },
  });
  const designer = await prisma.user.create({
    data: {
      id: uid(),
      email: "maya.designer@marketingos.demo",
      name: "Maya Puspita",
      role: Role.DESIGNER,
      department: "Creative",
    },
  });
  const viewer = await prisma.user.create({
    data: {
      id: uid(),
      email: "eko.viewer@marketingos.demo",
      name: "Eko Prasetyo",
      role: Role.VIEWER,
      department: "Leadership",
    },
  });

  const assignablePool = [manager, marketing, crm, finance, designer];

  console.log(
    `Created 8 users (1 per role): ${[owner, admin, manager, marketing, crm, finance, designer, viewer]
      .map((u) => u.role)
      .join(", ")}.`,
  );

  // ---- Campaigns: 3, across different statuses ----
  const campaign1 = await prisma.campaign.create({
    data: {
      name: "PPDB 2027 Early Bird",
      objective: "Drive early enrollment registrations for the 2027 intake",
      department: "Marketing",
      ownerId: manager.id,
      status: "RUNNING",
      priority: "HIGH",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-09-30"),
      budgetAllocated: 75_000_000,
      targetKpi: [{ name: "Registrations", target: 500, unit: "students" }],
      actualKpi: [{ name: "Registrations", actual: 210 }],
      description: "Early-bird enrollment push across social and search ahead of the 2027 school year.",
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      name: "Instagram Awareness Q3",
      objective: "Grow Instagram follower base and engagement in Q3",
      department: "Marketing",
      ownerId: marketing.id,
      status: "PLANNING",
      priority: "MEDIUM",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-10-31"),
      budgetAllocated: 30_000_000,
      targetKpi: [{ name: "Followers", target: 5000, unit: "followers" }],
      actualKpi: [],
      description: "Reels-first content calendar with a paid boost layer for the top 3 performing posts each week.",
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      name: "Alumni Referral Program 2026",
      objective: "Turn alumni into a referral channel for new leads",
      department: "Marketing",
      ownerId: owner.id,
      status: "COMPLETED",
      priority: "LOW",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-05-31"),
      budgetAllocated: 20_000_000,
      targetKpi: [{ name: "Referred leads", target: 100, unit: "leads" }],
      actualKpi: [{ name: "Referred leads", actual: 118 }],
      description: "Incentivized alumni referral drive, wrapped and reported at end of Q2.",
    },
  });

  const campaigns = [campaign1, campaign2, campaign3];
  console.log("Created 3 campaigns across RUNNING / PLANNING / COMPLETED.");

  // ---- Tasks: ~15, spread across statuses/assignees ----
  const taskStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"] as const;
  // Fixed ids seeded by the board_columns_checklist_labels migration.
  const columnIdByStatus: Record<(typeof taskStatuses)[number], string> = {
    TODO: "col_todo",
    IN_PROGRESS: "col_in_progress",
    REVIEW: "col_review",
    COMPLETED: "col_completed",
  };
  const taskTitles = [
    "Draft landing page copy",
    "Design Instagram carousel set",
    "Set up Meta Ads campaign",
    "Write email nurture sequence",
    "Brief influencer partners",
    "QA registration form",
    "Schedule content calendar for August",
    "Analyze week 1 performance",
    "Prepare alumni outreach list",
    "Record testimonial video",
    "Update FAQ knowledge base",
    "Coordinate print flyer delivery",
    "Review ad creative with legal",
    "Set up UTM tracking links",
    "Compile Q3 budget forecast",
  ];

  for (let i = 0; i < taskTitles.length; i++) {
    const campaign = campaigns[i % campaigns.length];
    const assignee = assignablePool[i % assignablePool.length];
    const status = taskStatuses[i % taskStatuses.length];
    await prisma.task.create({
      data: {
        title: taskTitles[i],
        campaignId: campaign.id,
        assigneeId: assignee.id,
        status,
        columnId: columnIdByStatus[status],
        priority: (["LOW", "MEDIUM", "HIGH", "URGENT"] as const)[i % 4],
        dueDate: new Date(Date.now() + (i - 5) * 3 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`Created ${taskTitles.length} tasks spread across statuses and assignees.`);

  // ---- Leads: ~20, across the full pipeline ----
  const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "WON", "LOST"] as const;
  const leadSources = ["WEBSITE", "WHATSAPP", "INSTAGRAM", "TIKTOK", "REFERRAL", "EVENT", "PAID_ADS", "EMAIL", "OTHER"] as const;
  const leadNames = [
    "Ahmad Fadillah", "Putri Anggraini", "Rizky Ramadhan", "Sari Wulandari", "Bayu Setiawan",
    "Indah Permatasari", "Fajar Nugroho", "Lestari Handayani", "Yoga Pratama", "Nadia Kusuma",
    "Dimas Prakoso", "Ayu Safitri", "Wahyu Hidayat", "Citra Melati", "Reza Firmansyah",
    "Diah Ratnasari", "Arif Hakim", "Wulan Sari", "Ilham Maulana", "Fitri Rahmawati",
  ];

  for (let i = 0; i < leadNames.length; i++) {
    const status = leadStatuses[i % leadStatuses.length];
    const campaign = campaigns[i % campaigns.length];
    await prisma.lead.create({
      data: {
        name: leadNames[i],
        company: i % 3 === 0 ? `PT ${leadNames[i].split(" ")[0]} Sejahtera` : null,
        source: leadSources[i % leadSources.length],
        status,
        ownerId: assignablePool[i % assignablePool.length].id,
        campaignId: campaign.id,
        potentialRevenue: 1_000_000 + i * 250_000,
        lastContactAt: status === "NEW" ? null : new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        notes: status === "WON" || status === "LOST" ? "Follow-up complete." : null,
      },
    });
  }
  console.log(`Created ${leadNames.length} leads across the full pipeline.`);

  // ---- Expenses: >=4 categories ----
  const expenseRows: { campaignId: string; category: "META_ADS" | "GOOGLE_ADS" | "INFLUENCER" | "EVENT" | "AGENCY" | "PRODUCTION" | "SOFTWARE" | "MISC"; description: string; amount: number }[] = [
    { campaignId: campaign1.id, category: "META_ADS", description: "Meta Ads boost — early bird carousel", amount: 8_500_000 },
    { campaignId: campaign1.id, category: "GOOGLE_ADS", description: "Google Search Ads — PPDB keywords", amount: 6_200_000 },
    { campaignId: campaign1.id, category: "PRODUCTION", description: "Video production — campaign trailer", amount: 12_000_000 },
    { campaignId: campaign2.id, category: "INFLUENCER", description: "Micro-influencer package (3 creators)", amount: 9_000_000 },
    { campaignId: campaign2.id, category: "SOFTWARE", description: "Scheduling tool subscription — Q3", amount: 1_200_000 },
    { campaignId: campaign3.id, category: "EVENT", description: "Alumni gathering — venue & catering", amount: 15_000_000 },
    { campaignId: campaign3.id, category: "AGENCY", description: "Referral program creative agency fee", amount: 5_000_000 },
    { campaignId: campaign3.id, category: "MISC", description: "Referral gift vouchers", amount: 3_500_000 },
  ];

  for (const row of expenseRows) {
    await prisma.expense.create({
      data: {
        campaignId: row.campaignId,
        category: row.category,
        description: row.description,
        amount: row.amount,
        createdById: finance.id,
        spentAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`Created ${expenseRows.length} expenses across ${new Set(expenseRows.map((r) => r.category)).size} categories.`);

  // ---- Knowledge: 3 articles ----
  await prisma.knowledgeArticle.create({
    data: {
      title: "PPDB Landing Page SOP",
      type: "SOP",
      body: "# PPDB Landing Page SOP\n\n1. Confirm KPI targets with the campaign owner.\n2. Draft copy in the shared doc, get Manager sign-off.\n3. Build the page in the CMS, wire UTM parameters.\n4. QA on mobile + desktop before launch.\n\n> Always test the registration form end-to-end before going live.",
      authorId: manager.id,
      campaignId: campaign1.id,
      tags: ["ppdb", "sop", "landing-page"],
    },
  });

  await prisma.knowledgeArticle.create({
    data: {
      title: "Instagram Reels Experiment — Hook Length",
      type: "EXPERIMENT",
      body: "# Reels Hook Length Experiment\n\n**Hypothesis:** shorter hooks (< 2s) outperform longer ones on completion rate.\n\n**Result:** hooks under 2 seconds saw a 18% lift in 3-second view rate across the test set.\n\n- Sample size: 24 reels\n- Duration: 2 weeks",
      authorId: marketing.id,
      campaignId: campaign2.id,
      tags: ["instagram", "experiment", "reels"],
    },
  });

  await prisma.knowledgeArticle.create({
    data: {
      title: "Alumni Referral Program — Campaign Review",
      type: "CAMPAIGN_REVIEW",
      body: "# Alumni Referral Program — Review\n\nExceeded the 100-lead target (118 referred leads, 118% of goal).\n\n## What worked\n- Gift voucher incentive drove most referrals in the first 2 weeks.\n- Alumni gathering event was the single best lead source.\n\n## What to change next time\n- Start the referral tracking link earlier — some early referrals weren't attributed correctly.",
      authorId: owner.id,
      campaignId: campaign3.id,
      tags: ["alumni", "referral", "review"],
    },
  });

  console.log("Created 3 knowledge articles.");

  console.log("\nSeed complete:");
  console.log(`  Users: 8 (1 per role)`);
  console.log(`  Campaigns: 3`);
  console.log(`  Tasks: ${taskTitles.length}`);
  console.log(`  Leads: ${leadNames.length}`);
  console.log(`  Expenses: ${expenseRows.length}`);
  console.log(`  Knowledge articles: 3`);
  console.log(`\nNote: seed users have no Supabase Auth account and cannot log in.`);
  console.log(`They exist only to populate demo data — log in with your own invited account.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
