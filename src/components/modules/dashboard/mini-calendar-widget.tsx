import { WidgetCard } from "./widget-card";
import { cn } from "@/lib/utils";
import type { Campaign, Task } from "@prisma/client";

type CalendarEvents = {
  campaigns: Pick<Campaign, "id" | "name" | "startDate" | "endDate">[];
  tasks: Pick<Task, "id" | "title" | "dueDate">[];
};

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function MiniCalendarWidget({ events }: { events: CalendarEvents }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const eventDays = new Set<string>();
  for (const c of events.campaigns) {
    if (c.startDate) eventDays.add(toDayKey(new Date(c.startDate)));
    if (c.endDate) eventDays.add(toDayKey(new Date(c.endDate)));
  }
  for (const t of events.tasks) {
    if (t.dueDate) eventDays.add(toDayKey(new Date(t.dueDate)));
  }

  const todayKey = toDayKey(now);
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const totalEvents = events.campaigns.length + events.tasks.length;

  return (
    <WidgetCard title={now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = toDayKey(new Date(year, month, day));
          const hasEvent = eventDays.has(key);
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className={cn(
                "flex h-6 items-center justify-center rounded-full",
                isToday && "bg-primary text-primary-foreground",
                hasEvent && !isToday && "font-semibold text-foreground",
                !hasEvent && !isToday && "text-muted-foreground",
              )}
            >
              {day}
            </div>
          );
        })}
      </div>
      {totalEvents === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">No dates this month.</p>
      )}
    </WidgetCard>
  );
}
