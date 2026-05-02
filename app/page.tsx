"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { CalendarArea } from "@/components/calendar/CalendarArea";
import type { CalendarEvent, SidebarSelection } from "@/lib/types";

const today = new Date();
function iso(daysOffset: number, hour = 20, min = 0) {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    creator_id: "me",
    title: "Cena en Lo de Fer",
    description: "Una noche tranqui con vino y picada. Llevar postre.",
    image_url:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
    start_at: iso(0, 21),
    end_at: iso(0, 23),
    location: "Av. Cabildo 1234",
    is_public: false,
    created_at: today.toISOString(),
  },
  {
    id: "2",
    creator_id: "me",
    title: "Cumple de Lucas",
    description: "Trae algo rico para compartir 🎉",
    image_url:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600",
    start_at: iso(2, 18),
    end_at: iso(2, 23),
    location: "Casa de Lucas",
    is_public: false,
    created_at: today.toISOString(),
  },
  {
    id: "3",
    creator_id: "me",
    title: "Reunión de equipo",
    description: "Revisar roadmap Q3.",
    image_url: null,
    start_at: iso(1, 10),
    end_at: iso(1, 11),
    location: "Oficina",
    is_public: false,
    created_at: today.toISOString(),
  },
  {
    id: "4",
    creator_id: "me",
    title: "Yoga al amanecer",
    description: "Clase outdoor en el parque.",
    image_url:
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600",
    start_at: iso(3, 7),
    end_at: iso(3, 8, 30),
    location: "Parque Centenario",
    is_public: true,
    created_at: today.toISOString(),
  },
  {
    id: "5",
    creator_id: "me",
    title: "Concierto Indie",
    description: "Banda nueva en Niceto.",
    image_url:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600",
    start_at: iso(5, 22),
    end_at: iso(6, 1),
    location: "Niceto Club",
    is_public: false,
    created_at: today.toISOString(),
  },
];

export default function HomePage() {
  const [selection, setSelection] = useState<SidebarSelection>({ kind: "self" });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        selection={selection}
        onSelect={setSelection}
        userName="Renzo"
      />
      <CalendarArea selection={selection} events={MOCK_EVENTS} />
    </div>
  );
}
