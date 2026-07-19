import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { listCampaigns, listDepartments } from "@/server/campaign.service";
import { listActiveUsers } from "@/server/user.service";
import { CampaignStatusBadge, PriorityBadge } from "@/components/modules/campaigns/status-badge";
import { CampaignFilters } from "@/components/modules/campaigns/campaign-filters";
import { CreateCampaignDialog } from "@/components/modules/campaigns/create-campaign-dialog";
import { formatDate, formatIDR } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Role, type CampaignStatus } from "@prisma/client";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const canCreate = authorize(user, "campaign:create");

  const [{ campaigns, nextCursor }, departments, users] = await Promise.all([
    listCampaigns({
      status: params.status as CampaignStatus | undefined,
      department: params.department,
      ownerId: params.ownerId,
      search: params.search,
      cursor: params.cursor,
      assignedTaskUserId: user.role === Role.DESIGNER ? user.id : undefined,
    }),
    listDepartments(),
    listActiveUsers(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-muted-foreground">All marketing campaigns in one place.</p>
        </div>
        {canCreate && <CreateCampaignDialog users={users} />}
      </div>

      <CampaignFilters departments={departments} owners={users} />

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No campaigns match these filters yet.
          {canCreate && " Create one to get started."}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Budget used / allocated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    {c.department && (
                      <div className="text-xs text-muted-foreground">{c.department}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={c.priority} />
                  </TableCell>
                  <TableCell>{c.owner.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(c.startDate)} – {formatDate(c.endDate)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatIDR(c.budgetUsed)} / {formatIDR(c.budgetAllocated.toString())}
                    {c.budgetUsed > Number(c.budgetAllocated) && (
                      <Badge variant="destructive" className="ml-2">
                        Over
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {nextCursor && (
        <Link
          href={`/campaigns?${new URLSearchParams({ ...params, cursor: nextCursor }).toString()}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          Load more →
        </Link>
      )}
    </div>
  );
}
