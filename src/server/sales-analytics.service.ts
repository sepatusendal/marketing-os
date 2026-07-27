import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { jakartaStartOfMonth } from "@/lib/jakarta-time";
import { LEAD_STATUS_ORDER } from "@/lib/lead-labels";
import type { LeadStatus } from "@prisma/client";

/**
 * Win-probability weights per stage, for a weighted (forecasted) pipeline
 * value — standard CRM practice (HubSpot/Salesforce "deal probability").
 * Static per-stage weights rather than per-lead history since MarketingOS
 * doesn't track historical win rates per stage yet; revisit once there's
 * enough Won/Lost volume to derive these empirically instead.
 */
const STAGE_PROBABILITY: Partial<Record<LeadStatus, number>> = {
  NEW: 0.05,
  CONTACTED: 0.15,
  QUALIFIED: 0.3,
  PROPOSAL_SENT: 0.5,
  INTERNAL_REVIEW: 0.65,
  NEGOTIATION: 0.8,
};

const OPEN_STATUSES: LeadStatus[] = LEAD_STATUS_ORDER.filter((s) => s !== "WON" && s !== "LOST");

export const getNewLeadsThisMonth = cache(async function getNewLeadsThisMonth() {
  return prisma.lead.count({ where: { createdAt: { gte: jakartaStartOfMonth(new Date()) } } });
});

/** Open pipeline value broken down by stage — where the money currently sits, not just where the leads sit. */
export const getPipelineByStage = cache(async function getPipelineByStage() {
  const rows = await prisma.lead.groupBy({
    by: ["status"],
    where: { status: { in: OPEN_STATUSES } },
    _count: true,
    _sum: { potentialRevenue: true },
  });

  return OPEN_STATUSES.map((status) => {
    const row = rows.find((r) => r.status === status);
    return {
      status,
      count: row?._count ?? 0,
      value: (row?._sum.potentialRevenue ?? 0).toString(),
    };
  }).filter((s) => s.count > 0);
});

/** Open pipeline value, both raw and probability-weighted (forecasted). */
export const getPipelineForecast = cache(async function getPipelineForecast() {
  const leads = await prisma.lead.findMany({
    where: { status: { in: OPEN_STATUSES } },
    select: { status: true, potentialRevenue: true },
  });

  let raw = 0;
  let weighted = 0;
  for (const l of leads) {
    const value = Number(l.potentialRevenue ?? 0);
    raw += value;
    weighted += value * (STAGE_PROBABILITY[l.status] ?? 0);
  }

  return { openCount: leads.length, rawValue: raw.toString(), weightedValue: Math.round(weighted).toString() };
});

/**
 * Stage-by-stage funnel with conversion rate between consecutive stages.
 * Since stage history isn't event-sourced, "at this stage" is approximated
 * as cumulative — currently at this stage or any stage further along
 * (Lost leads excluded, since they broke out of the linear progression
 * rather than advancing through it).
 */
export const getFunnelConversion = cache(async function getFunnelConversion() {
  const rows = await prisma.lead.groupBy({ by: ["status"], _count: true });
  const counts = Object.fromEntries(rows.map((r) => [r.status, r._count])) as Record<LeadStatus, number>;

  const progressionStages = [...OPEN_STATUSES, "WON" as LeadStatus];
  const cumulative = progressionStages.map((_, i) =>
    progressionStages.slice(i).reduce((sum, s) => sum + (counts[s] ?? 0), 0),
  );

  return progressionStages.map((status, i) => ({
    status,
    count: cumulative[i],
    conversionFromPrevious: i === 0 ? 100 : cumulative[i - 1] > 0 ? Math.round((cumulative[i] / cumulative[i - 1]) * 100) : 0,
  }));
});

/** New leads / won count / won revenue per month, for the last `months` months. */
export const getSalesTrend = cache(async function getSalesTrend(months = 6) {
  const now = new Date();
  const from = jakartaStartOfMonth(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1));

  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: from } },
    select: { createdAt: true, status: true, updatedAt: true, potentialRevenue: true },
  });

  const monthKeys: string[] = [];
  const labels: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    labels.push(d.toLocaleDateString("en-US", { month: "short" }));
  }

  const createdByMonth = new Map<string, number>();
  const wonByMonth = new Map<string, number>();
  const revenueByMonth = new Map<string, number>();

  for (const l of leads) {
    const createdKey = `${l.createdAt.getFullYear()}-${String(l.createdAt.getMonth() + 1).padStart(2, "0")}`;
    createdByMonth.set(createdKey, (createdByMonth.get(createdKey) ?? 0) + 1);

    if (l.status === "WON") {
      const wonKey = `${l.updatedAt.getFullYear()}-${String(l.updatedAt.getMonth() + 1).padStart(2, "0")}`;
      wonByMonth.set(wonKey, (wonByMonth.get(wonKey) ?? 0) + 1);
      revenueByMonth.set(
        wonKey,
        (revenueByMonth.get(wonKey) ?? 0) + Number(l.potentialRevenue ?? 0),
      );
    }
  }

  return {
    labels,
    newLeads: monthKeys.map((k) => createdByMonth.get(k) ?? 0),
    won: monthKeys.map((k) => wonByMonth.get(k) ?? 0),
    revenue: monthKeys.map((k) => revenueByMonth.get(k) ?? 0),
  };
});

/** Per-owner leaderboard — leads owned, won, win rate, revenue, avg deal size. */
export const getOwnerPerformance = cache(async function getOwnerPerformance() {
  const rows = await prisma.lead.groupBy({
    by: ["ownerId", "status"],
    where: { ownerId: { not: null } },
    _count: true,
    _sum: { potentialRevenue: true },
  });

  const ownerIds = [...new Set(rows.map((r) => r.ownerId).filter((id): id is string => !!id))];
  const owners = await prisma.user.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  return ownerIds
    .map((ownerId) => {
      const ownerRows = rows.filter((r) => r.ownerId === ownerId);
      const total = ownerRows.reduce((sum, r) => sum + r._count, 0);
      const won = ownerRows.find((r) => r.status === "WON")?._count ?? 0;
      const lost = ownerRows.find((r) => r.status === "LOST")?._count ?? 0;
      const decided = won + lost;
      const revenue = Number(ownerRows.find((r) => r.status === "WON")?._sum.potentialRevenue ?? 0);
      const owner = ownerMap.get(ownerId);
      return {
        ownerId,
        name: owner?.name ?? "Unknown",
        avatarUrl: owner?.avatarUrl ?? null,
        total,
        won,
        winRate: decided > 0 ? Math.round((won / decided) * 100) : 0,
        revenue: revenue.toString(),
        avgDealSize: won > 0 ? Math.round(revenue / won) : 0,
      };
    })
    .sort((a, b) => b.revenue.localeCompare(a.revenue, undefined, { numeric: true }));
});

/** Highest-value clients — the accounts worth protecting first. */
export const getTopClients = cache(async function getTopClients(limit = 8) {
  return prisma.client.findMany({
    where: { contractValue: { not: null } },
    orderBy: { contractValue: "desc" },
    take: limit,
    select: { id: true, name: true, company: true, status: true, contractValue: true, owner: { select: { name: true } } },
  });
});

/** New clients per month, for the last `months` months — growth, not just a point-in-time count. */
export const getClientGrowthTrend = cache(async function getClientGrowthTrend(months = 6) {
  const now = new Date();
  const from = jakartaStartOfMonth(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1));

  const clients = await prisma.client.findMany({
    where: { since: { gte: from } },
    select: { since: true },
  });

  const monthKeys: string[] = [];
  const labels: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    labels.push(d.toLocaleDateString("en-US", { month: "short" }));
  }

  const byMonth = new Map<string, number>();
  for (const c of clients) {
    const key = `${c.since.getFullYear()}-${String(c.since.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  return { labels, newClients: monthKeys.map((k) => byMonth.get(k) ?? 0) };
});
