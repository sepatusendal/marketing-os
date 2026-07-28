import { Trophy } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HorizontalBarChart } from "@/components/ui/charts/horizontal-bar-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIDRCompact, initials } from "@/lib/format";
import type { getOwnerPerformance } from "@/server/sales-analytics.service";

const MEDAL = ["🥇", "🥈", "🥉"];
const RANK_COLOR = ["bg-amber-500", "bg-slate-400", "bg-orange-600", "bg-primary"];

/** Ranked by revenue won — who's actually closing, not just who owns the most leads. */
export function OwnerLeaderboard({ data }: { data: Awaited<ReturnType<typeof getOwnerPerformance>> }) {
  if (data.length === 0) {
    return (
      <WidgetCard size="sm" title="Sales Leaderboard" accent="amber" icon={Trophy}>
        <p className="text-sm text-muted-foreground">No leads assigned to owners yet.</p>
      </WidgetCard>
    );
  }

  const top8 = data.slice(0, 8);

  return (
    <WidgetCard size="sm" title="Sales Leaderboard" accent="amber" icon={Trophy}>
      <div className="space-y-5">
        <HorizontalBarChart
          data={top8.map((owner, i) => ({
            key: owner.ownerId,
            label: owner.name,
            value: Number(owner.revenue),
            colorClass: RANK_COLOR[Math.min(i, 3)],
            valueLabel: formatIDRCompact(owner.revenue),
            detail: `${owner.won}/${owner.total} won · ${owner.winRate}% win rate`,
          }))}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rep</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Won</TableHead>
              <TableHead className="text-right">Win Rate</TableHead>
              <TableHead className="text-right">Avg Deal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {top8.map((owner, i) => (
              <TableRow key={owner.ownerId}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-center text-xs">{MEDAL[i] ?? i + 1}</span>
                    <Avatar size="sm">
                      {owner.avatarUrl && <AvatarImage src={owner.avatarUrl} alt={owner.name} />}
                      <AvatarFallback>{initials(owner.name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{owner.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{owner.total}</TableCell>
                <TableCell className="text-right text-muted-foreground">{owner.won}</TableCell>
                <TableCell className="text-right text-muted-foreground">{owner.winRate}%</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatIDRCompact(owner.avgDealSize)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </WidgetCard>
  );
}
