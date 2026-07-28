import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ACCENT_CHIP, ACCENT_WASH, type AccentColor } from "@/lib/accent-colors";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function WidgetCard({
  title,
  action,
  children,
  accent,
  icon: Icon,
  size = "default",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  accent?: AccentColor;
  icon?: LucideIcon;
  /** "sm" for dense grids (analytics/reports) — tighter padding, smaller title/icon. */
  size?: "default" | "sm";
}) {
  const sm = size === "sm";

  return (
    <Card size={size} className={cn(accent && ACCENT_WASH[accent])}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          {Icon && accent && (
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-md",
                sm ? "h-5 w-5" : "h-6 w-6",
                ACCENT_CHIP[accent],
              )}
            >
              <Icon className={sm ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </span>
          )}
          <CardTitle className={sm ? "text-sm" : "text-base"}>{title}</CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent className={sm ? "text-sm" : undefined}>{children}</CardContent>
    </Card>
  );
}
