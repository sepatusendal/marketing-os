/**
 * Tiny inline trend line — no axes, no labels, just shape. 2px line per the
 * dataviz mark spec. Purely decorative context next to a KPI number, so it
 * carries no interaction of its own.
 */
export function Sparkline({
  values,
  className,
  colorVar = "var(--primary)",
}: {
  values: number[];
  className?: string;
  colorVar?: string;
}) {
  if (values.length < 2) return null;

  const width = 80;
  const height = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none" aria-hidden="true">
      <path d={path} fill="none" stroke={colorVar} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
