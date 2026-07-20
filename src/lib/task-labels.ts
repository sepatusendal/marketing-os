/** Fixed color-label palette for task cards (Trello-style dots, not a managed entity). */
export const TASK_LABEL_COLORS = ["red", "orange", "yellow", "green", "blue", "purple"] as const;
export type TaskLabelColor = (typeof TASK_LABEL_COLORS)[number];

export const TASK_LABEL_HEX: Record<TaskLabelColor, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
};
