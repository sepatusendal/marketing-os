const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal",
  INTERNAL_REVIEW: "Review",
  NEGOTIATION: "Negotiation",
  WON: "Won",
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-chart-1",
  CONTACTED: "bg-chart-2",
  QUALIFIED: "bg-chart-3",
  PROPOSAL_SENT: "bg-chart-6",
  INTERNAL_REVIEW: "bg-chart-7",
  NEGOTIATION: "bg-chart-4",
  WON: "bg-chart-5",
};

export function FunnelChart({
  rows,
}: {
  rows: { source: string; byStatus: { status: string; count: number }[] }[];
}) {
  const stages = [
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "PROPOSAL_SENT",
    "INTERNAL_REVIEW",
    "NEGOTIATION",
    "WON",
  ];
  const totals = stages.map((stage) => ({
    stage,
    count: rows.reduce(
      (sum, r) => sum + (r.byStatus.find((s) => s.status === stage)?.count ?? 0),
      0,
    ),
  }));

  const max = Math.max(1, ...totals.map((t) => t.count));

  if (totals.every((t) => t.count === 0)) return null;

  return (
    <div className="mb-4 grid grid-cols-4 gap-3 sm:grid-cols-7">
      {totals.map((t) => (
        <div key={t.stage} className="space-y-2">
          <div className="flex h-24 items-end rounded-md bg-muted/50 p-1">
            <div
              className={`w-full rounded-sm ${STAGE_COLORS[t.stage]} transition-all`}
              style={{ height: `${(t.count / max) * 100}%` }}
            />
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums leading-none">{t.count}</p>
            <p className="text-xs text-muted-foreground">{STAGE_LABELS[t.stage]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
