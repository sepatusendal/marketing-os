import { cn } from "@/lib/utils";

/**
 * Subtle line-art illustration for empty states — abstract, low-key,
 * themed via currentColor so it tracks light/dark automatically.
 */
export function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      className={cn("text-muted-foreground/40", className)}
      aria-hidden="true"
    >
      <rect x="24" y="20" width="88" height="64" rx="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 40h88" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="36" cy="30" r="2.5" fill="currentColor" />
      <circle cx="46" cy="30" r="2.5" fill="currentColor" />
      <circle cx="56" cy="30" r="2.5" fill="currentColor" />
      <path
        d="M40 58l14 14 26-30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary/50"
      />
      <circle cx="120" cy="76" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" />
      <circle cx="18" cy="88" r="6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
