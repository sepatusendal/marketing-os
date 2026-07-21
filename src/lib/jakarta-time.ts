/**
 * Asia/Jakarta is a fixed UTC+7 offset with no DST, so "what day is it in
 * Jakarta" can be computed with plain arithmetic instead of a timezone
 * database. Every function here uses UTC getters/Date.UTC exclusively —
 * never the Date object's "local" fields — so behavior is identical
 * whether the server process itself runs in UTC (Vercel) or any other zone
 * (a local dev machine). CLAUDE.md: "Store dates in UTC, display in
 * Asia/Jakarta" — this is the shared implementation of that rule for
 * day-bucketed dashboard aggregates.
 */

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function jakartaParts(date: Date) {
  const shifted = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

/** Calendar-day key ("2026-07-21") for `date` as seen in Jakarta local time. */
export function jakartaDayKey(date: Date): string {
  const { year, month, day } = jakartaParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Short display label ("Jul 21") for `date` as seen in Jakarta local time. */
export function jakartaDayLabel(date: Date): string {
  const { month, day } = jakartaParts(date);
  return `${MONTH_ABBR[month]} ${day}`;
}

/** The UTC instant of local midnight in Jakarta on the calendar day `date` falls on there. */
export function jakartaStartOfDay(date: Date): Date {
  const { year, month, day } = jakartaParts(date);
  return new Date(Date.UTC(year, month, day, 0, 0, 0) - JAKARTA_OFFSET_MS);
}

/** The UTC instant of local midnight in Jakarta on the 1st of the month `date` falls in there. */
export function jakartaStartOfMonth(date: Date): Date {
  const { year, month } = jakartaParts(date);
  return new Date(Date.UTC(year, month, 1, 0, 0, 0) - JAKARTA_OFFSET_MS);
}

/** Jakarta calendar days from `start` to `end`, inclusive, as UTC instants of each day's Jakarta midnight. */
export function jakartaDayRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cursor = jakartaStartOfDay(start);
  const last = jakartaStartOfDay(end);
  while (cursor.getTime() <= last.getTime()) {
    days.push(cursor);
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}
