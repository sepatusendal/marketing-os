import { formatIDR } from "@/lib/format";

const CHART_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

export function CategoryBreakdown({
  breakdown,
}: {
  breakdown: { category: string; total: number }[];
}) {
  if (breakdown.length === 0) {
    return <p className="text-sm text-muted-foreground">No expenses logged yet.</p>;
  }

  const total = breakdown.reduce((sum, b) => sum + b.total, 0);
  const max = Math.max(...breakdown.map((b) => b.total));

  return (
    <div className="space-y-4">
      {/* Stacked proportion bar — the shape of the spend at a glance. */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {breakdown.map((b, i) => (
          <div
            key={b.category}
            className={CHART_COLORS[i % CHART_COLORS.length]}
            style={{ width: `${total > 0 ? (b.total / total) * 100 : 0}%` }}
            title={`${b.category.replaceAll("_", " ")}: ${formatIDR(b.total)}`}
          />
        ))}
      </div>

      <div className="space-y-2">
        {breakdown.map((b, i) => (
          <div key={b.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${CHART_COLORS[i % CHART_COLORS.length]}`}
                />
                {b.category.replaceAll("_", " ")}
              </span>
              <span className="tabular-nums text-muted-foreground">{formatIDR(b.total)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className={`h-1.5 rounded-full ${CHART_COLORS[i % CHART_COLORS.length]}`}
                style={{ width: `${max > 0 ? (b.total / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
