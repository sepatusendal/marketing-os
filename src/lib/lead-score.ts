import type { LeadSource, LeadStatus } from "@prisma/client";

/**
 * Lead score (0-100): how worth prioritizing a lead is right now.
 * Three signals, summed:
 *  - source quality (0-30): historically how well this channel converts
 *  - potential revenue (0-40): deal size tier
 *  - pipeline progress (0-30): how far the lead has moved — the strongest
 *    single signal that a lead is real and engaged, not just sitting there
 */
const SOURCE_WEIGHTS: Record<LeadSource, number> = {
  REFERRAL: 30,
  WEBSITE: 25,
  EVENT: 20,
  WHATSAPP: 22,
  EMAIL: 18,
  INSTAGRAM: 18,
  PAID_ADS: 15,
  TIKTOK: 12,
  OTHER: 10,
};

const STATUS_WEIGHTS: Record<LeadStatus, number> = {
  WON: 30,
  NEGOTIATION: 27,
  INTERNAL_REVIEW: 24,
  PROPOSAL_SENT: 22,
  QUALIFIED: 20,
  CONTACTED: 12,
  NEW: 5,
  LOST: 0,
};

function revenueScore(potentialRevenue: number | null): number {
  if (!potentialRevenue) return 0;
  if (potentialRevenue >= 20_000_000) return 40;
  if (potentialRevenue >= 10_000_000) return 32;
  if (potentialRevenue >= 5_000_000) return 24;
  if (potentialRevenue >= 1_000_000) return 16;
  return 8;
}

export function computeLeadScore(lead: {
  source: LeadSource;
  status: LeadStatus;
  potentialRevenue: number | null;
}): number {
  return SOURCE_WEIGHTS[lead.source] + STATUS_WEIGHTS[lead.status] + revenueScore(lead.potentialRevenue);
}

export type ScoreTier = "hot" | "warm" | "cool";

export function getScoreTier(score: number): ScoreTier {
  if (score >= 65) return "hot";
  if (score >= 35) return "warm";
  return "cool";
}
