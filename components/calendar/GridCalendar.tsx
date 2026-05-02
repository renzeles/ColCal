"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import multiMonthPlugin from "@fullcalendar/multimonth";
import type { CalendarEvent } from "@/lib/types";

type Props = {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
};

export function GridCalendar({ events, onEventClick }: Props) {
  return (
    <div className="h-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="100%"
        firstDay={1}
        locale="es"
        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          year: "Año",
        }}
        multiMonthMaxColumns={3}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start_at,
          end: e.end_at ?? undefined,
          extendedProps: e,
        }))}
        eventClick={(info) => {
          const e = info.event.extendedProps as CalendarEvent;
          onEventClick?.(e);
        }}
        dayMaxEvents={3}
      />
    </div>
  );
}
