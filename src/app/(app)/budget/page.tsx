import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import type { ExpenseCategory } from "@prisma/client";
import {
  listCampaignBudgetSummaries,
  listExpenses,
  categoryBreakdown,
} from "@/server/expense.service";
import { listCampaignOptions } from "@/server/campaign.service";
import { BudgetSummaryTable } from "@/components/modules/budget/budget-summary-table";
import { CategoryBreakdown } from "@/components/modules/budget/category-breakdown";
import { ExpenseHistoryTable } from "@/components/modules/budget/expense-history-table";
import { BudgetFilters } from "@/components/modules/budget/budget-filters";
import { AddExpenseDialog } from "@/components/modules/budget/add-expense-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  if (!authorize(user, "budget:view")) {
    return (
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Budget</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view budget data.</p>
      </div>
    );
  }

  const canEdit = authorize(user, "expense:edit");

  const [summaries, campaignOptions, breakdown, expenses] = await Promise.all([
    listCampaignBudgetSummaries(),
    listCampaignOptions(),
    categoryBreakdown(),
    listExpenses({
      campaignId: params.campaignId,
      category: params.category as ExpenseCategory | undefined,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budget</h1>
          <p className="text-muted-foreground">
            Allocated vs. used across every campaign.
          </p>
        </div>
        {canEdit && <AddExpenseDialog campaignOptions={campaignOptions} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetSummaryTable summaries={summaries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBreakdown breakdown={breakdown} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BudgetFilters campaignOptions={campaignOptions} />
          <ExpenseHistoryTable expenses={expenses} />
        </CardContent>
      </Card>
    </div>
  );
}
