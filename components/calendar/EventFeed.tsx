"use client";

import { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { EventCard } from "./EventCard";
import type { CalendarEvent } from "@/lib/types";

type Props = {
  events: CalendarEvent[];
  onEventClick?: (e: CalendarEvent) => void;
};

export function EventFeed({ events, onEventClick }: Props) {
  const grouped = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) =>
        new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
    const groups: { day: Date; items: CalendarEvent[] }[] = [];
    for (const ev of sorted) {
      const d = new Date(ev.start_at);
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.day, d)) last.items.push(ev);
      else groups.push({ day: d, items: [ev] });
    }
    return groups;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <span className="text-2xl">📅</span>
        </div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          No hay eventos todavía
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Creá tu primer evento con el botón +
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-1 pb-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {grouped.map((g) => (
          <section key={g.day.toISOString()}>
            <div className="sticky top-0 z-10 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md py-2 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {format(g.day, "EEEE d 'de' MMMM", { locale: es })}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.items.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onClick={() => onEventClick?.(ev)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
