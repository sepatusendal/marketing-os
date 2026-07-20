import { cn } from "@/lib/utils";
import { getScoreTier } from "@/lib/lead-score";

const TIER_STYLES: Record<ReturnType<typeof getScoreTier>, string> = {
  hot: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  warm: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  cool: "bg-muted text-muted-foreground",
};

export function LeadScoreBadge({ score, className }: { score: number; className?: string }) {
  const tier = getScoreTier(score);
  return (
    <span
      title={`Lead score: ${score}/100`}
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[11px] font-medium tabular-nums",
        TIER_STYLES[tier],
        className,
      )}
    >
      {tier === "hot" && "🔥"}
      {score}
    </span>
  );
}
