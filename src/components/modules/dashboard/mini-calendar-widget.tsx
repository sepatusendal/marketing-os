"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { WidgetCard } from "./widget-card";
import { cn } from "@/lib/utils";
import { WIDGET_ACCENT, ACCENT_HEX } from "@/lib/accent-colors";
import type { Campaign, Task } from "@prisma/client";

type CalendarEvents = {
  campaigns: Pick<Campaign, "id" | "name" | "startDate" | "endDate">[];
  tasks: Pick<Task, "id" | "title" | "dueDate">[];
};

type EventType = "campaign_start" | "campaign_end" | "task_due";

const EVENT_DOT: Record<EventType, string> = {
  campaign_start: ACCENT_HEX.emerald,
  campaign_end: ACCENT_HEX.violet,
  task_due: ACCENT_HEX.amber,
};

const EVENT_LEGEND: { type: EventType; label: string }[] = [
  { type: "campaign_start", label: "Campaign start" },
  { type: "campaign_end", label: "Campaign end" },
  { type: "task_due", label: "Task due" },
];

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function MiniCalendarWidget({ events }: { events: CalendarEvents }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const eventsByDay = new Map<string, { label: string; type: EventType }[]>();
  function addEvent(key: string, label: string, type: EventType) {
    const list = eventsByDay.get(key) ?? [];
    list.push({ label, type });
    eventsByDay.set(key, list);
  }
  for (const c of events.campaigns) {
    if (c.startDate) addEvent(toDayKey(new Date(c.startDate)), `${c.name} starts`, "campaign_start");
    if (c.endDate) addEvent(toDayKey(new Date(c.endDate)), `${c.name} ends`, "campaign_end");
  }
  for (const t of events.tasks) {
    if (t.dueDate) addEvent(toDayKey(new Date(t.dueDate)), `${t.title} due`, "task_due");
  }

  const todayKey = toDayKey(now);
  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const totalEvents = events.campaigns.length + events.tasks.length;

  return (
    <WidgetCard
      title={now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
      accent={WIDGET_ACCENT.miniCalendar}
      icon={CalendarDays}
    >
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const key = toDayKey(new Date(year, month, day));
          const dayEvents = eventsByDay.get(key);
          const hasEvent = !!dayEvents;
          const isToday = key === todayKey;
          const uniqueTypes = [...new Set((dayEvents ?? []).map((e) => e.type))];
          return (
            <div
              key={i}
              className="relative flex flex-col items-center gap-0.5"
              onMouseEnter={() => hasEvent && setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey((h) => (h === key ? null : h))}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground",
                  hasEvent && !isToday && "cursor-default font-semibold text-foreground",
                  !hasEvent && !isToday && "text-muted-foreground",
                )}
              >
                {day}
              </div>
              <div className="flex h-1.5 gap-0.5">
                {uniqueTypes.map((type) => (
                  <span
                    key={type}
                    className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: isToday ? "var(--primary-foreground)" : EVENT_DOT[type] }}
                  />
                ))}
              </div>
              {hoveredKey === key && dayEvents && (
                <div className="glass-panel absolute bottom-full left-1/2 z-10 mb-1 w-max max-w-48 -translate-x-1/2 rounded-md px-2 py-1.5 text-left text-xs text-popover-foreground shadow-md">
                  {dayEvents.map((e, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: EVENT_DOT[e.type] }} />
                      {e.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {totalEvents === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No dates this month.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-3 border-t pt-2 text-[11px] text-muted-foreground">
          {EVENT_LEGEND.map((l) => (
            <span key={l.type} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: EVENT_DOT[l.type] }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}
