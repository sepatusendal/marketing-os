import type { EntityType } from "@prisma/client";

/** Resolves a notification's entity to a URL for click-through navigation. */
export function notificationHref(entityType: EntityType | null, entityId: string | null) {
  if (!entityType || !entityId) return "/dashboard";
  switch (entityType) {
    case "TASK":
      return "/tasks";
    case "CAMPAIGN":
      return `/campaigns/${entityId}`;
    case "LEAD":
      return "/leads";
    default:
      return "/dashboard";
  }
}
