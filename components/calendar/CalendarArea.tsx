"use client";

import { useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarView, SidebarSelection } from "@/lib/types";
import { GridCalendar } from "./GridCalendar";
import { EventFeed } from "./EventFeed";

type Props = {
  selection: SidebarSelection;
  events: CalendarEvent[];
  onNewEvent?: () => void;
  onEventClick?: (e: CalendarEvent) => void;
};

function selectionLabel(s: SidebarSelection) {
  if (s.kind === "self") return "Mi calendario";
  return s.name;
}

export function CalendarArea({ selection, events, onNewEvent, onEventClick }: Props) {
  const [view, setView] = useState<CalendarView>("grid");

  return (
    <div className="flex-1 h-screen flex flex-col">
      <header className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {selectionLabel(selection)}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {events.length} {events.length === 1 ? "evento" : "eventos"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <button
            onClick={onNewEvent}
            className="ml-2 h-9 px-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-6">
        {view === "grid" ? (
          <div className="h-full bg-white dark:bg-zinc-900/40 rounded-2xl border border-black/5 dark:border-white/5 p-4 shadow-sm">
            <GridCalendar events={events} onEventClick={onEventClick} />
          </div>
        ) : (
          <EventFeed events={events} onEventClick={onEventClick} />
        )}
      </div>
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: CalendarView;
  onChange: (v: CalendarView) => void;
}) {
  return (
    <div className="inline-flex items-center p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5">
      <ToggleBtn
        active={view === "grid"}
        onClick={() => onChange("grid")}
        label="Grilla"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </ToggleBtn>
      <ToggleBtn
        active={view === "feed"}
        onClick={() => onChange("feed")}
        label="Eventos"
      >
        <List className="h-3.5 w-3.5" />
      </ToggleBtn>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition",
        active
          ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white"
          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      )}
    >
      {children}
      {label}
    </button>
  );
}
