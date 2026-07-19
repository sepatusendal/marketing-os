import { WidgetCard } from "./widget-card";
import type { LeadStatus } from "@prisma/client";

export function LeadSummaryWidget({
  summary,
}: {
  summary: { byStatus: { status: LeadStatus; count: number }[]; newLast7Days: number };
}) {
  const total = summary.byStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <WidgetCard title="Lead Summary">
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">No leads yet.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {summary.byStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-1">
                <span className="text-muted-foreground">{s.status}</span>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.newLast7Days} new lead{summary.newLast7Days === 1 ? "" : "s"} in the last 7
            days
          </p>
        </div>
      )}
    </WidgetCard>
  );
}
