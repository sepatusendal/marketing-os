"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Users, UserCheck, UserX, Wallet, Plus, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "@/components/modules/dashboard/kpi-card";
import { ClientTable, type ClientWithRelations } from "./client-table";
import { ClientDrawer } from "./client-drawer";
import { ClientImportDialog } from "./client-import-dialog";
import { CLIENT_STATUS_ORDER, CLIENT_STATUS_LABEL } from "@/lib/client-labels";
import { formatIDRCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClientStatus } from "@prisma/client";

export type ClientStats = {
  total: number;
  active: number;
  inactive: number;
  churned: number;
  activeContractValue: string;
};

export function ClientsView({
  clients,
  stats,
  users,
  canEdit,
}: {
  clients: ClientWithRelations[];
  stats: ClientStats;
  users: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const exportQuery = new URLSearchParams(
    Object.fromEntries(
      Object.entries({
        status: searchParams.get("status") ?? undefined,
        search: searchParams.get("search") ?? undefined,
      }).filter(([, v]) => v),
    ) as Record<string, string>,
  ).toString();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total clients" value={stats.total} icon={Users} accent="indigo" />
        <KpiCard label="Active" value={stats.active} icon={UserCheck} accent="emerald" />
        <KpiCard label="Inactive / churned" value={stats.inactive + stats.churned} icon={UserX} accent="amber" />
        <KpiCard
          label="Active contract value"
          value={formatIDRCompact(stats.activeContractValue)}
          icon={Wallet}
          accent="violet"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParam("search", search || null);
            }}
            onBlur={() => updateParam("search", search || null)}
            className="w-52"
          />
          <Select
            value={searchParams.get("status") ?? "all"}
            onValueChange={(v) => updateParam("status", v === "all" ? null : String(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CLIENT_STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {CLIENT_STATUS_LABEL[s as ClientStatus]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && <ClientImportDialog />}
          <a
            href={`/api/clients/export?${exportQuery}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </a>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedClient(null);
                setDrawerOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Client
            </Button>
          )}
        </div>
      </div>

      <ClientTable
        clients={clients}
        onOpen={(client) => {
          setSelectedClient(client);
          setDrawerOpen(true);
        }}
      />

      <ClientDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        client={selectedClient}
        users={users}
        canEdit={canEdit}
      />
    </div>
  );
}
