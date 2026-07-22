import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { listLeads } from "@/server/lead.service";
import { toCsv } from "@/lib/csv";
import type { LeadStatus, LeadSource } from "@prisma/client";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!authorize(user, "lead:view")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const leads = await listLeads({
    status: (searchParams.get("status") as LeadStatus) || undefined,
    source: (searchParams.get("source") as LeadSource) || undefined,
    search: searchParams.get("search") || undefined,
  });

  const csv = toCsv(
    leads.map((l) => ({
      name: l.name,
      company: l.company ?? "",
      phone: l.phone ?? "",
      industry: l.industry ?? "",
      source: l.source,
      status: l.status,
      owner: l.owner?.name ?? "",
      campaign: l.campaign?.name ?? "",
      potentialRevenue: l.potentialRevenue?.toString() ?? "",
      lastContactAt: l.lastContactAt?.toISOString().slice(0, 10) ?? "",
      nextFollowUpAt: l.nextFollowUpAt?.toISOString().slice(0, 10) ?? "",
      lostReason: l.lostReason ?? "",
      createdAt: l.createdAt.toISOString().slice(0, 10),
      notes: l.notes ?? "",
    })),
    [
      { key: "name", label: "Name" },
      { key: "company", label: "Company" },
      { key: "phone", label: "Phone" },
      { key: "industry", label: "Industry" },
      { key: "source", label: "Source" },
      { key: "status", label: "Status" },
      { key: "owner", label: "Owner" },
      { key: "campaign", label: "Campaign" },
      { key: "potentialRevenue", label: "Potential Revenue" },
      { key: "lastContactAt", label: "Last Contact" },
      { key: "nextFollowUpAt", label: "Next Follow-up" },
      { key: "lostReason", label: "Lost Reason" },
      { key: "createdAt", label: "Created" },
      { key: "notes", label: "Notes" },
    ],
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="leads.csv"',
    },
  });
}
