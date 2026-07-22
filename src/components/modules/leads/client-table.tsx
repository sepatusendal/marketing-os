"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatIDR, initials } from "@/lib/format";
import { EmptyInboxIllustration } from "@/components/ui/empty-illustration";
import { ClientStatusBadge } from "./client-status-badge";
import type { Client, User, Lead, Campaign } from "@prisma/client";

export type ClientWithRelations = Omit<Client, "contractValue" | "since"> & {
  contractValue: string | null;
  since: string | Date;
  owner: User | null;
  lead: (Lead & { owner: User | null; campaign: Pick<Campaign, "id" | "name"> | null }) | null;
};

export function ClientTable({
  clients,
  onOpen,
}: {
  clients: ClientWithRelations[];
  onOpen: (client: ClientWithRelations) => void;
}) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <EmptyInboxIllustration className="h-24 w-32" />
        <p>No clients match these filters.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead className="text-right">Contract value</TableHead>
          <TableHead>Client since</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((c) => (
          <TableRow key={c.id} className="cursor-pointer" onClick={() => onOpen(c)}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {initials(c.name)}
                </div>
                {c.name}
              </div>
            </TableCell>
            <TableCell>{c.company ?? "—"}</TableCell>
            <TableCell>
              <ClientStatusBadge status={c.status} />
            </TableCell>
            <TableCell>{c.owner?.name ?? "—"}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {c.phone || c.email || "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {c.contractValue != null ? formatIDR(c.contractValue) : "—"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{formatDate(c.since)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
