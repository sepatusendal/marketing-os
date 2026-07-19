import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatIDR } from "@/lib/format";
import type { Expense, User, Campaign } from "@prisma/client";

type ExpenseRow = Expense & {
  createdBy: User;
  campaign: Pick<Campaign, "id" | "name"> | null;
};

export function ExpenseHistoryTable({
  expenses,
  showCampaign = true,
}: {
  expenses: ExpenseRow[];
  showCampaign?: boolean;
}) {
  if (expenses.length === 0) {
    return <p className="text-sm text-muted-foreground">No expenses match these filters.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          {showCampaign && <TableHead>Campaign</TableHead>}
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Added by</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(e.spentAt)}
            </TableCell>
            {showCampaign && <TableCell>{e.campaign?.name ?? "—"}</TableCell>}
            <TableCell className="text-sm">{e.category.replaceAll("_", " ")}</TableCell>
            <TableCell>{e.description}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{e.createdBy.name}</TableCell>
            <TableCell className="text-right">{formatIDR(e.amount.toString())}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
