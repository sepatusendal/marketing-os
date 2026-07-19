import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchX } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <SearchX className="h-8 w-8 text-muted-foreground" />
      <div>
        <p className="font-medium">Not found.</p>
        <p className="text-sm text-muted-foreground">
          This item doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
      </div>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
        Back to dashboard
      </Link>
    </div>
  );
}
