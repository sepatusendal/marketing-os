import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { Role, type CampaignStatus } from "@prisma/client";
import { listCampaignsForExport } from "@/server/campaign.service";
import { toCsv } from "@/lib/csv";
import { formatIDR } from "@/lib/format";

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);

  const campaigns = await listCampaignsForExport({
    status: (searchParams.get("status") as CampaignStatus) || undefined,
    department: searchParams.get("department") || undefined,
    ownerId: searchParams.get("ownerId") || undefined,
    search: searchParams.get("search") || undefined,
    assignedTaskUserId: user.role === Role.DESIGNER ? user.id : undefined,
  });

  const csv = toCsv(
    campaigns.map((c) => ({
      name: c.name,
      department: c.department ?? "",
      status: c.status,
      priority: c.priority,
      owner: c.owner.name,
      startDate: c.startDate?.toISOString().slice(0, 10) ?? "",
      endDate: c.endDate?.toISOString().slice(0, 10) ?? "",
      budgetAllocated: formatIDR(c.budgetAllocated.toString()),
      budgetUsed: formatIDR(c.budgetUsed),
      objective: c.objective ?? "",
    })),
    [
      { key: "name", label: "Name" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
      { key: "priority", label: "Priority" },
      { key: "owner", label: "Owner" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "budgetAllocated", label: "Budget Allocated" },
      { key: "budgetUsed", label: "Budget Used" },
      { key: "objective", label: "Objective" },
    ],
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="campaigns.csv"',
    },
  });
}
