import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CLIENT_STATUS_LABEL, CLIENT_STATUS_STYLE } from "@/lib/client-labels";
import type { ClientStatus } from "@prisma/client";

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant="outline" className={cn("border-0 font-medium", CLIENT_STATUS_STYLE[status])}>
      {CLIENT_STATUS_LABEL[status]}
    </Badge>
  );
}
