import { cn } from "@/lib/utils";

/**
 * Flat, multi-color empty-state illustrations (Notion-style, not literal
 * line-art) — colors pull from the chart-1..5 tokens so they stay in the
 * app's palette and track light/dark automatically via the CSS variables.
 */

/** Generic fallback — used wherever no more specific illustration fits. */
export function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" className={cn(className)} aria-hidden="true">
      <rect x="24" y="20" width="88" height="64" rx="12" fill="var(--chart-1)" opacity="0.14" />
      <rect
        x="24"
        y="20"
        width="88"
        height="64"
        rx="12"
        stroke="var(--chart-1)"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <path d="M24 40h88" stroke="var(--chart-1)" strokeWidth="1.5" opacity="0.5" />
      <circle cx="36" cy="30" r="2.5" fill="var(--chart-4)" />
      <circle cx="46" cy="30" r="2.5" fill="var(--chart-3)" />
      <circle cx="56" cy="30" r="2.5" fill="var(--chart-5)" />
      <path
        d="M40 58l14 14 26-30"
        stroke="var(--chart-5)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="120" cy="76" r="16" stroke="var(--chart-2)" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.6" />
      <circle cx="18" cy="88" r="6" fill="var(--chart-3)" opacity="0.5" />
    </svg>
  );
}

/** "No results" — knowledge base search, filtered lists. */
export function EmptySearchIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" className={cn(className)} aria-hidden="true">
      <circle cx="68" cy="54" r="30" fill="var(--chart-2)" opacity="0.14" />
      <circle cx="68" cy="54" r="30" stroke="var(--chart-2)" strokeWidth="2" opacity="0.6" />
      <line
        x1="89"
        y1="76"
        x2="112"
        y2="99"
        stroke="var(--chart-4)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="58" cy="50" r="3" fill="var(--chart-4)" />
      <circle cx="78" cy="50" r="3" fill="var(--chart-4)" />
      <path
        d="M58 62c4 4 14 4 20 0"
        stroke="var(--chart-4)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="26" cy="24" r="5" fill="var(--chart-3)" opacity="0.6" />
      <circle cx="132" cy="30" r="4" fill="var(--chart-5)" opacity="0.6" />
      <circle cx="24" cy="92" r="4" fill="var(--chart-1)" opacity="0.5" />
    </svg>
  );
}

/** Empty inbox / list — leads pipeline, notifications. */
export function EmptyInboxIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" className={cn(className)} aria-hidden="true">
      <path
        d="M28 46h104l-10 40a8 8 0 0 1-7.8 6H45.8a8 8 0 0 1-7.8-6l-10-40Z"
        fill="var(--chart-1)"
        opacity="0.14"
      />
      <path
        d="M28 46h104l-10 40a8 8 0 0 1-7.8 6H45.8a8 8 0 0 1-7.8-6l-10-40Z"
        stroke="var(--chart-1)"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <path d="M28 46h30l6 10h28l6-10h34" stroke="var(--chart-1)" strokeWidth="1.5" opacity="0.6" />
      <rect x="58" y="20" width="44" height="8" rx="4" fill="var(--chart-3)" opacity="0.7" />
      <rect x="66" y="8" width="28" height="8" rx="4" fill="var(--chart-5)" opacity="0.6" />
      <circle cx="128" cy="22" r="5" fill="var(--chart-4)" opacity="0.6" />
      <circle cx="20" cy="70" r="4" fill="var(--chart-2)" opacity="0.6" />
    </svg>
  );
}
