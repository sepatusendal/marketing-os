import type { LeadStatus, LeadLostReason } from "@prisma/client";

/** Canonical funnel order — single source of truth for every status list/column in the UI. */
export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "INTERNAL_REVIEW",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  INTERNAL_REVIEW: "Internal Review",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const LEAD_LOST_REASON_ORDER: LeadLostReason[] = [
  "BUDGET",
  "TIMING",
  "COMPETITOR",
  "NO_RESPONSE",
  "NOT_A_FIT",
  "OTHER",
];

export const LEAD_LOST_REASON_LABEL: Record<LeadLostReason, string> = {
  BUDGET: "Budget / no funding",
  TIMING: "Bad timing (try again later)",
  COMPETITOR: "Went with a competitor",
  NO_RESPONSE: "Stopped responding",
  NOT_A_FIT: "Not a fit",
  OTHER: "Other",
};
