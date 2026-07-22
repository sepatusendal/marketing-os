import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import type { ClientStatus } from "@prisma/client";
import { listClients, getClientStats } from "@/server/client.service";
import { listActiveUsers } from "@/server/user.service";
import { ClientsView } from "@/components/modules/leads/clients-view";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  if (!authorize(user, "lead:view")) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view clients.</p>
      </div>
    );
  }

  const canEdit = authorize(user, "lead:crud");

  const [rawClients, stats, users] = await Promise.all([
    listClients({
      status: params.status as ClientStatus | undefined,
      search: params.search,
    }),
    getClientStats(),
    listActiveUsers(),
  ]);

  const clients = rawClients.map((c) => ({
    ...c,
    contractValue: c.contractValue?.toString() ?? null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/leads" className="text-sm text-muted-foreground hover:underline">
            ← Back to leads
          </Link>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">
            Won business — converted from leads, or synced directly from your existing roster.
          </p>
        </div>
      </div>

      <ClientsView clients={clients} stats={stats} users={users} canEdit={canEdit} />
    </div>
  );
}
