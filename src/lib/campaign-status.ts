import { CampaignStatus } from "@prisma/client";

const ORDER: CampaignStatus[] = [
  CampaignStatus.DRAFT,
  CampaignStatus.PLANNING,
  CampaignStatus.RUNNING,
  CampaignStatus.COMPLETED,
  CampaignStatus.ARCHIVED,
];

/**
 * PRD §9.2 status flow: DRAFT → PLANNING → RUNNING → COMPLETED → ARCHIVED,
 * one step back allowed from any state, except un-archiving — which is
 * restricted to Admin/Owner regardless of the general edit permission.
 */
export function getAllowedTransitions(
  current: CampaignStatus,
  canUnarchive: boolean,
): CampaignStatus[] {
  const idx = ORDER.indexOf(current);
  const forward = idx < ORDER.length - 1 ? [ORDER[idx + 1]] : [];
  const backward = idx > 0 ? [ORDER[idx - 1]] : [];

  if (current === CampaignStatus.ARCHIVED) {
    return canUnarchive ? backward : [];
  }

  return [...forward, ...backward];
}

export function isValidTransition(
  current: CampaignStatus,
  next: CampaignStatus,
  canUnarchive: boolean,
): boolean {
  return getAllowedTransitions(current, canUnarchive).includes(next);
}
