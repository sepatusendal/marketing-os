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
    case "TASK:labels_changed":
      return "changed a task's labels";
    case "TASK:checklist_item_added":
      return `added a checklist item "${meta?.label ?? ""}"`;
    case "TASK:checklist_item_checked":
      return `checked off "${meta?.label ?? ""}"`;
    case "TASK:checklist_item_unchecked":
      return `unchecked "${meta?.label ?? ""}"`;
    case "TASK:checklist_item_removed":
      return "removed a checklist item";
    case "BOARD_COLUMN:created":
      return `created the "${meta?.name ?? ""}" column`;
    case "BOARD_COLUMN:updated":
      return `updated the "${meta?.name ?? ""}" column`;
    case "BOARD_COLUMN:deleted":
      return "deleted a board column";
    case "BOARD_COLUMN:reordered":
      return "reordered board columns";
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
