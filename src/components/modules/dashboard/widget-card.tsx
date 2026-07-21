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
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  accent?: AccentColor;
  icon?: LucideIcon;
}) {
  return (
    <Card className={cn(accent && ACCENT_WASH[accent])}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          {Icon && accent && (
            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", ACCENT_CHIP[accent])}>
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
