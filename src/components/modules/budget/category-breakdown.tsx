import { formatIDR } from "@/lib/format";

export function CategoryBreakdown({
  breakdown,
}: {
  breakdown: { category: string; total: number }[];
}) {
  if (breakdown.length === 0) {
    return <p className="text-sm text-muted-foreground">No expenses logged yet.</p>;
  }

  const max = Math.max(...breakdown.map((b) => b.total));

  return (
    <div className="space-y-2">
      {breakdown.map((b) => (
        <div key={b.category} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{b.category.replaceAll("_", " ")}</span>
            <span className="text-muted-foreground">{formatIDR(b.total)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${max > 0 ? (b.total / max) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
