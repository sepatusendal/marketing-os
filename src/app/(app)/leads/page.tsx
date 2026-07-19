import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import type { LeadStatus, LeadSource } from "@prisma/client";
import { listLeads, listLeadsPaginated } from "@/server/lead.service";
import { listCampaignOptions } from "@/server/campaign.service";
import { listActiveUsers } from "@/server/user.service";
import { LeadPipelineBoard } from "@/components/modules/leads/lead-pipeline-board";
import { LeadTable } from "@/components/modules/leads/lead-table";
import { LeadFilters } from "@/components/modules/leads/lead-filters";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  if (!authorize(user, "lead:view")) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view leads.</p>
      </div>
    );
  }

  const canEdit = authorize(user, "lead:crud");
  const view = params.view === "table" ? "table" : "board";

  const leadFilters = {
    status: params.status as LeadStatus | undefined,
    source: params.source as LeadSource | undefined,
    search: params.search,
  };

  const [rawResult, campaignOptions, users] = await Promise.all([
    view === "table"
      ? listLeadsPaginated({ ...leadFilters, cursor: params.cursor })
      : listLeads(leadFilters).then((leads) => ({ leads, nextCursor: null as string | null })),
    listCampaignOptions(),
    listActiveUsers(),
  ]);

  const leads = rawResult.leads.map((l) => ({
    ...l,
    potentialRevenue: l.potentialRevenue?.toString() ?? null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-muted-foreground">Pipeline for every incoming lead.</p>
        </div>
        <Link href="/leads/clients" className="text-sm text-muted-foreground hover:underline">
          View clients →
        </Link>
      </div>

      <LeadFilters view={view} />

      {view === "board" ? (
        <LeadPipelineBoard
          leads={leads}
          campaignOptions={campaignOptions}
          users={users}
          canEdit={canEdit}
        />
      ) : (
        <>
          <LeadTable leads={leads} campaignOptions={campaignOptions} users={users} canEdit={canEdit} />
          {rawResult.nextCursor && (
            <Link
              href={`/leads?${new URLSearchParams({ ...params, view: "table", cursor: rawResult.nextCursor }).toString()}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              Load more →
            </Link>
          )}
        </>
      )}
    </div>
  );
}
