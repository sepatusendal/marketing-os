import { Trophy } from "lucide-react";
import { WidgetCard } from "@/components/modules/dashboard/widget-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIDRCompact, initials } from "@/lib/format";
import type { getOwnerPerformance } from "@/server/sales-analytics.service";

const MEDAL = ["🥇", "🥈", "🥉"];

/** Ranked by revenue won — who's actually closing, not just who owns the most leads. */
export function OwnerLeaderboard({ data }: { data: Awaited<ReturnType<typeof getOwnerPerformance>> }) {
  if (data.length === 0) {
    return (
      <WidgetCard title="Sales Leaderboard" accent="amber" icon={Trophy}>
        <p className="text-sm text-muted-foreground">No leads assigned to owners yet.</p>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Sales Leaderboard" accent="amber" icon={Trophy}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rep</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Won</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 8).map((owner, i) => (
            <TableRow key={owner.ownerId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="w-4 shrink-0 text-center text-xs">{MEDAL[i] ?? i + 1}</span>
                  <Avatar size="sm">
                    <AvatarImage src={owner.avatarUrl ?? undefined} alt={owner.name} />
                    <AvatarFallback>{initials(owner.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium">{owner.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{owner.total}</TableCell>
              <TableCell className="text-right text-muted-foreground">{owner.won}</TableCell>
              <TableCell className="text-right text-muted-foreground">{owner.winRate}%</TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatIDRCompact(owner.revenue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </WidgetCard>
  );
}
