import type { LeadStatus } from "@prisma/client";

/** Hours since last contact before a lead is considered overdue for follow-up. */
export const FOLLOWUP_SLA_HOURS = 48;

const TERMINAL_STATUSES: LeadStatus[] = ["WON", "LOST"];

export type FollowupStaleness = "fresh" | "warning" | "overdue" | "scheduled" | "none";

/** Hours since the lead was last touched — last contact if any, else creation. */
export function hoursSinceContact(lead: {
  lastContactAt: Date | null;
  createdAt: Date;
}): number {
  const reference = lead.lastContactAt ?? lead.createdAt;
  return (Date.now() - reference.getTime()) / (1000 * 60 * 60);
}

/**
 * Follow-up staleness for a lead. WON/LOST leads never need follow-up.
 * A manually set `nextFollowUpAt` overrides the generic 48h SLA entirely —
 * a lead deliberately parked ("call back after the yayasan meeting next
 * month") shouldn't get flagged overdue just because the SLA clock ran out;
 * conversely once that date passes it's overdue regardless of the SLA math.
 * "warning" kicks in at half the SLA window so a lead never jumps straight
 * from fresh to overdue with no notice.
 */
export function getLeadStaleness(lead: {
  status: LeadStatus;
  lastContactAt: Date | null;
  createdAt: Date;
  nextFollowUpAt?: Date | null;
}): FollowupStaleness {
  if (TERMINAL_STATUSES.includes(lead.status)) return "none";

  if (lead.nextFollowUpAt) {
    return lead.nextFollowUpAt.getTime() <= Date.now() ? "overdue" : "scheduled";
  }

  const hours = hoursSinceContact(lead);
  if (hours >= FOLLOWUP_SLA_HOURS) return "overdue";
  if (hours >= FOLLOWUP_SLA_HOURS / 2) return "warning";
  return "fresh";
}

export function isOverdueForFollowup(lead: {
  status: LeadStatus;
  lastContactAt: Date | null;
  createdAt: Date;
  nextFollowUpAt?: Date | null;
}): boolean {
  return getLeadStaleness(lead) === "overdue";
}
