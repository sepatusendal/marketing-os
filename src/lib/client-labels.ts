import type { ClientStatus } from "@prisma/client";

export const CLIENT_STATUS_ORDER: ClientStatus[] = ["ACTIVE", "INACTIVE", "CHURNED"];

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  CHURNED: "Churned",
};

export const CLIENT_STATUS_STYLE: Record<ClientStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  INACTIVE: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  CHURNED: "bg-red-500/15 text-red-600 dark:text-red-400",
};
