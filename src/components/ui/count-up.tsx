"use client";

import { useEffect, useRef, useState } from "react";

/** Animates from 0 to `value` on mount — a small Apple-ish flourish for stat numbers. */
export function CountUp({
  value,
  duration = 600,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic — decelerates like Apple's spring-ish transitions
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    }

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}
