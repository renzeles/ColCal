"use client";

import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Clock } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  event: CalendarEvent;
  onClick?: () => void;
};

const GRADIENTS = [
  "from-blue-400 to-purple-500",
  "from-pink-400 to-orange-500",
  "from-emerald-400 to-cyan-500",
  "from-amber-400 to-rose-500",
  "from-indigo-400 to-pink-500",
];

function gradientFor(id: string) {
  const idx =
    id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function dateLabel(d: Date) {
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  if (isThisWeek(d, { weekStartsOn: 1 }))
    return format(d, "EEEE", { locale: es });
  return format(d, "EEE d MMM", { locale: es });
}

export function EventCard({ event, onClick }: Props) {
  const start = new Date(event.start_at);
  const time = format(start, "HH:mm");
  const gradient = gradientFor(event.id);

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-2xl bg-white dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative h-32 overflow-hidden">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              gradient
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md text-[11px] font-semibold capitalize">
          {dateLabel(start)}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight truncate">
          {event.title}
        </h3>

        {event.description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {time}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
