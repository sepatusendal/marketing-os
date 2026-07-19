import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { listClients } from "@/server/lead.service";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ClientsPage() {
  const user = await requireUser();

  if (!authorize(user, "lead:view")) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view clients.</p>
      </div>
    );
  }

  const clients = await listClients();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/leads" className="text-sm text-muted-foreground hover:underline">
          ← Back to leads
        </Link>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-muted-foreground">Leads that converted to won business.</p>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">No clients yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Client since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.company ?? "—"}</TableCell>
                <TableCell>{c.lead.owner?.name ?? "—"}</TableCell>
                <TableCell>{c.lead.campaign?.name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(c.since)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
