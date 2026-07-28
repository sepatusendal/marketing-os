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
  size = "default",
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  accent: AccentColor;
  secondary?: ReactNode;
  sparkline?: ReactNode;
  /** "sm" for dense KPI rows (analytics/reports) — same anatomy, tighter padding and type scale. */
  size?: "default" | "sm";
}) {
  const sm = size === "sm";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        sm ? "rounded-xl p-3" : "p-5",
        ACCENT_WASH[accent],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex items-center justify-center rounded-xl",
            sm ? "h-7 w-7 rounded-lg" : "h-10 w-10",
            ACCENT_CHIP[accent],
          )}
        >
          <Icon className={sm ? "h-3.5 w-3.5" : "h-5 w-5"} />
        </span>
        {sparkline && <div className={sm ? "h-5 w-14" : "h-7 w-20"}>{sparkline}</div>}
      </div>
      <p className={cn("text-muted-foreground", sm ? "mt-1.5 text-xs" : "mt-3 text-sm")}>{label}</p>
      <p
        className={cn(
          "font-heading font-semibold tracking-tight text-foreground",
          sm ? "text-base" : "text-2xl",
        )}
      >
        {value}
      </p>
      {secondary && (
        <div className={cn("text-muted-foreground", sm ? "mt-0.5 text-[11px]" : "mt-1 text-xs")}>
          {secondary}
        </div>
      )}
    </div>
  );
}
