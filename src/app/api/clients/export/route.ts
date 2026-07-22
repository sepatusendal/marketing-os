import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { listClients } from "@/server/client.service";
import { toCsv } from "@/lib/csv";
import type { ClientStatus } from "@prisma/client";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!authorize(user, "lead:view")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const clients = await listClients({
    status: (searchParams.get("status") as ClientStatus) || undefined,
    search: searchParams.get("search") || undefined,
  });

  const csv = toCsv(
    clients.map((c) => ({
      name: c.name,
      company: c.company ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      industry: c.industry ?? "",
      status: c.status,
      contractValue: c.contractValue?.toString() ?? "",
      owner: c.owner?.name ?? "",
      since: c.since.toISOString().slice(0, 10),
      notes: c.notes ?? "",
    })),
    [
      { key: "name", label: "Name" },
      { key: "company", label: "Company" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "industry", label: "Industry" },
      { key: "status", label: "Status" },
      { key: "contractValue", label: "Contract Value" },
      { key: "owner", label: "Owner" },
      { key: "since", label: "Client Since" },
      { key: "notes", label: "Notes" },
    ],
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="clients.csv"',
    },
  });
}
