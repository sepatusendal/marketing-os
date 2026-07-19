import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { getBudgetByCategoryReport } from "@/server/report.service";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!authorize(user, "reports:view")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rows = await getBudgetByCategoryReport({
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  });

  const csv = toCsv(rows, [
    { key: "month", label: "Month" },
    { key: "category", label: "Category" },
    { key: "total", label: "Total" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="budget-by-category.csv"',
    },
  });
}
