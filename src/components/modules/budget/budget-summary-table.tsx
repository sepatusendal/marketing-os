import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Summary = {
  id: string;
  name: string;
  allocated: number;
  used: number;
  remaining: number;
  percentUsed: number;
};

export function BudgetSummaryTable({ summaries }: { summaries: Summary[] }) {
  if (summaries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No campaigns with a budget yet.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign</TableHead>
          <TableHead className="text-right">Allocated</TableHead>
          <TableHead className="text-right">Used</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead className="text-right">% Used</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summaries.map((s) => {
          const overAllocated = s.used > s.allocated;
          return (
            <TableRow key={s.id}>
              <TableCell>
                <Link href={`/campaigns/${s.id}`} className="hover:underline">
                  {s.name}
                </Link>
              </TableCell>
              <TableCell className="text-right">{formatIDR(s.allocated)}</TableCell>
              <TableCell className="text-right">{formatIDR(s.used)}</TableCell>
              <TableCell className="text-right">{formatIDR(s.remaining)}</TableCell>
              <TableCell className="text-right">
                {overAllocated ? (
                  <Badge variant="destructive">{s.percentUsed}% over</Badge>
                ) : (
                  <span>{s.percentUsed}%</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
