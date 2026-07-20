/**
 * Decorative accent for the dashboard hero — abstract growth-line + dot
 * grid, very low opacity so it reads as texture rather than content.
 * Hidden on small screens to keep the greeting the only thing in view there.
 */
export function DashboardHeroIllustration() {
  return (
    <svg
      viewBox="0 0 420 200"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute -right-4 top-0 hidden h-[140px] w-[320px] text-primary md:block"
    >
      <g opacity="0.5">
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 10 }).map((_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={230 + col * 18}
              cy={20 + row * 18}
              r="1.6"
              fill="currentColor"
              opacity={0.15 + ((row + col) % 3) * 0.08}
            />
          )),
        )}
      </g>
      <path
        d="M20 150c40-6 60-40 95-46s55 22 90-4 70-58 110-52"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.25"
      />
      <circle cx="315" cy="48" r="5" fill="currentColor" opacity="0.35" />
      <circle cx="20" cy="150" r="4" fill="currentColor" opacity="0.35" />
      <circle cx="150" cy="60" r="60" stroke="currentColor" strokeWidth="1" opacity="0.08" />
    </svg>
  );
}
