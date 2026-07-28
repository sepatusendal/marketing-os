import { Crown } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { ClientStatusBadge } from "@/components/modules/leads/client-status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIDR } from "@/lib/format";
import type { getTopClients } from "@/server/sales-analytics.service";

/** Highest-value accounts — the ones that most deserve proactive attention. */
export function TopClientsTable({ data }: { data: Awaited<ReturnType<typeof getTopClients>> }) {
  if (data.length === 0) {
    return (
      <WidgetCard size="sm" title="Top Clients by Value" accent="violet" icon={Crown}>
        <p className="text-sm text-muted-foreground">No clients with a contract value yet.</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard size="sm" title="Top Clients by Value" accent="violet" icon={Crown}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="text-right">Contract Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                {c.name}
                {c.company && <span className="ml-1 text-muted-foreground">· {c.company}</span>}
              </TableCell>
              <TableCell>
                <ClientStatusBadge status={c.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{c.owner?.name ?? "—"}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatIDR(c.contractValue!.toString())}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </WidgetCard>
  );
}
