import { formatIDR } from "@/lib/format";
import type { ActivityLog } from "@prisma/client";

/** Human-readable label for an ActivityLog entry, shared by Campaign Timeline and the Dashboard Recent Activity widget (PRD §9.9). */
export function describeActivity(entry: ActivityLog) {
  const meta = entry.meta as Record<string, unknown> | null;

  switch (`${entry.entityType}:${entry.action}`) {
    case "CAMPAIGN:created":
      return "created a campaign";
    case "CAMPAIGN:updated":
      return "updated campaign details";
    case "CAMPAIGN:status_changed":
      return `moved a campaign from ${meta?.from} to ${meta?.to}`;
    case "TASK:created":
      return "created a task";
    case "TASK:updated":
      return "updated a task";
    case "TASK:status_changed":
      return `moved a task from ${meta?.from} to ${meta?.to}`;
    case "EXPENSE:created":
      return `logged an expense of ${formatIDR(String(meta?.amount ?? 0))}`;
    case "LEAD:created":
      return "created a lead";
    case "LEAD:updated":
      return "updated a lead";
    case "LEAD:status_changed":
      return `moved a lead from ${meta?.from} to ${meta?.to}`;
    case "LEAD:contacted":
      return "logged contact with a lead";
    case "CLIENT:created":
      return "converted a lead to a client";
    case "ASSET:created":
      return `uploaded ${meta?.fileName ?? "a file"}`;
    case "CAMPAIGN:commented":
    case "TASK:commented":
    case "LEAD:commented":
      return "left a comment";
    default:
      return entry.action;
  }
}
