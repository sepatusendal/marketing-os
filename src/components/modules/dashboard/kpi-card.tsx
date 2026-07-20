import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT_CHIP, ACCENT_WASH, type AccentColor } from "@/lib/accent-colors";

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  secondary,
  sparkline,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  accent: AccentColor;
  secondary?: ReactNode;
  sparkline?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        ACCENT_WASH[accent],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", ACCENT_CHIP[accent])}>
          <Icon className="h-5 w-5" />
        </span>
        {sparkline && <div className="h-7 w-20">{sparkline}</div>}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {secondary && <div className="mt-1 text-xs text-muted-foreground">{secondary}</div>}
    </div>
  );
}
