import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { getCampaignPerformanceReport } from "@/server/report.service";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await requireUser();
  if (!authorize(user, "reports:view")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const rows = await getCampaignPerformanceReport();
  const csv = toCsv(
    rows.map((r) => ({
      ...r,
      startDate: r.startDate?.toISOString().slice(0, 10) ?? "",
      endDate: r.endDate?.toISOString().slice(0, 10) ?? "",
      targetKpi: r.targetKpi.map((k) => `${k.name}: ${k.target}${k.unit ?? ""}`).join("; "),
      actualKpi: r.actualKpi.map((k) => `${k.name}: ${k.actual}`).join("; "),
    })),
    [
      { key: "name", label: "Campaign" },
      { key: "status", label: "Status" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "budgetAllocated", label: "Budget Allocated" },
      { key: "budgetUsed", label: "Budget Used" },
      { key: "targetKpi", label: "Target KPI" },
      { key: "actualKpi", label: "Actual KPI" },
      { key: "taskCompletionPercent", label: "Task Completion %" },
    ],
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="campaign-performance.csv"',
    },
  });
}
