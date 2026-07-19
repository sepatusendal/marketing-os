import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { getLeadFunnelReport } from "@/server/report.service";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!authorize(user, "reports:view")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rows = await getLeadFunnelReport({
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  });

  const csv = toCsv(
    rows.map((r) => ({
      source: r.source,
      total: r.total,
      conversionPercent: r.conversionPercent,
      ...Object.fromEntries(r.byStatus.map((s) => [s.status, s.count])),
    })),
    [
      { key: "source", label: "Source" },
      { key: "NEW", label: "New" },
      { key: "CONTACTED", label: "Contacted" },
      { key: "QUALIFIED", label: "Qualified" },
      { key: "NEGOTIATION", label: "Negotiation" },
      { key: "WON", label: "Won" },
      { key: "LOST", label: "Lost" },
      { key: "total", label: "Total" },
      { key: "conversionPercent", label: "Conversion %" },
    ],
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="lead-funnel.csv"',
    },
  });
}
