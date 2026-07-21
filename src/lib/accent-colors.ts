import type { Priority, LeadStatus, CampaignStatus, LeadSource } from "@prisma/client";

/**
 * Shared accent-color vocabulary for card surfaces (left border stripe +
 * icon chip). Reuses the same hues already established in
 * status-badge.tsx so a "HIGH" priority card and a "HIGH" priority badge
 * always agree, instead of each surface inventing its own palette.
 */
export type AccentColor =
  | "slate"
  | "blue"
  | "emerald"
  | "violet"
  | "amber"
  | "red"
  | "rose"
  | "cyan"
  | "indigo";

export const ACCENT_BORDER: Record<AccentColor, string> = {
  slate: "border-l-slate-400 dark:border-l-slate-500",
  blue: "border-l-blue-500",
  emerald: "border-l-emerald-500",
  violet: "border-l-violet-500",
  amber: "border-l-amber-500",
  red: "border-l-red-500",
  rose: "border-l-rose-500",
  cyan: "border-l-cyan-500",
  indigo: "border-l-primary",
};

/** Solid bar-fill classes (bar/meter charts) — same hues as ACCENT_BORDER/ACCENT_CHIP. */
export const ACCENT_FILL: Record<AccentColor, string> = {
  slate: "bg-slate-400 dark:bg-slate-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
  indigo: "bg-primary",
};

/** Real color values (not Tailwind classes) for SVG stroke/fill — donut and
 * line charts can't consume `bg-*` utility classes. Same hues as ACCENT_FILL. */
export const ACCENT_HEX: Record<AccentColor, string> = {
  slate: "#94a3b8",
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  red: "#ef4444",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  indigo: "var(--primary)",
};

export const ACCENT_CHIP: Record<AccentColor, string> = {
  slate: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  red: "bg-red-500/15 text-red-600 dark:text-red-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  cyan: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  indigo: "bg-primary/15 text-primary",
};

/** Very subtle top-of-card wash so accented cards read as tinted, not just striped. */
export const ACCENT_WASH: Record<AccentColor, string> = {
  slate: "bg-gradient-to-b from-slate-500/[0.06] to-transparent",
  blue: "bg-gradient-to-b from-blue-500/[0.06] to-transparent",
  emerald: "bg-gradient-to-b from-emerald-500/[0.06] to-transparent",
  violet: "bg-gradient-to-b from-violet-500/[0.06] to-transparent",
  amber: "bg-gradient-to-b from-amber-500/[0.06] to-transparent",
  red: "bg-gradient-to-b from-red-500/[0.06] to-transparent",
  rose: "bg-gradient-to-b from-rose-500/[0.06] to-transparent",
  cyan: "bg-gradient-to-b from-cyan-500/[0.06] to-transparent",
  indigo: "bg-gradient-to-b from-primary/[0.06] to-transparent",
};

export const PRIORITY_ACCENT: Record<Priority, AccentColor> = {
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "amber",
  URGENT: "red",
};

/** Same hues as CampaignStatusBadge (status-badge.tsx) — kept in sync so a
 * bar in the dashboard chart and the badge on the campaigns table always
 * agree on what "RUNNING" looks like. */
export const CAMPAIGN_STATUS_BAR: Record<CampaignStatus, string> = {
  DRAFT: "bg-slate-400 dark:bg-slate-500",
  PLANNING: "bg-blue-500",
  RUNNING: "bg-emerald-500",
  COMPLETED: "bg-violet-500",
  ARCHIVED: "bg-zinc-400 dark:bg-zinc-500",
};

export const LEAD_STATUS_ACCENT: Record<LeadStatus, AccentColor> = {
  NEW: "slate",
  CONTACTED: "blue",
  QUALIFIED: "cyan",
  NEGOTIATION: "amber",
  WON: "emerald",
  LOST: "red",
};

/** Fixed hue order for lead sources (categorical — assigned in order, never
 * cycled or re-sorted by rank). 9 sources, 9 palette slots. */
export const LEAD_SOURCE_ACCENT: Record<LeadSource, AccentColor> = {
  WEBSITE: "indigo",
  INSTAGRAM: "violet",
  WHATSAPP: "emerald",
  REFERRAL: "amber",
  PAID_ADS: "rose",
  EMAIL: "blue",
  TIKTOK: "cyan",
  EVENT: "red",
  OTHER: "slate",
};

/**
 * Reserved status colors (good/warning/critical) — for state, never reused
 * as a categorical "series" color. Used by meters/gauges like budget usage.
 */
export type StatusLevel = "good" | "warning" | "critical";

export const STATUS_FILL: Record<StatusLevel, string> = {
  good: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

export const STATUS_HEX: Record<StatusLevel, string> = {
  good: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
};

export const STATUS_TEXT: Record<StatusLevel, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
};

export function budgetStatus(percentUsed: number): StatusLevel {
  if (percentUsed > 100) return "critical";
  if (percentUsed >= 80) return "warning";
  return "good";
}

export const WIDGET_ACCENT = {
  budget: "amber",
  tasks: "blue",
  notifications: "rose",
  campaignsByStatus: "violet",
  miniCalendar: "cyan",
  leadSummary: "emerald",
  followup: "red",
  activeCampaigns: "indigo",
  recentActivity: "slate",
} satisfies Record<string, AccentColor>;
