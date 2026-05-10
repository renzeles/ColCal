"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, MapPin, Share2 } from "lucide-react";

type DemoEvent = {
  id: string;
  title: string;
  venue: string;
  location: string;
  dateLabel: string;
  image: string;
  startISO: string;
  endISO: string;
  spots: number;
};

const EVENTS: DemoEvent[] = [
  {
    id: "1",
    title: "Chef en Vivo",
    venue: "La Parrilla del Puerto",
    location: "Puerto Madero, CABA",
    dateLabel: "Sáb 16 may · 21:00 hs",
    spots: 12,
    startISO: "2026-05-16T21:00:00",
    endISO: "2026-05-16T23:30:00",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&h=340",
  },
  {
    id: "2",
    title: "Rolling Stones Tribute",
    venue: "Bar Hood",
    location: "Palermo, CABA",
    dateLabel: "Dom 17 may · 22:00 hs",
    spots: 5,
    startISO: "2026-05-17T22:00:00",
    endISO: "2026-05-18T01:00:00",
    image:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&h=340",
  },
  {
    id: "3",
    title: "Noche de Jazz",
    venue: "Club del Vino",
    location: "Chacarita, CABA",
    dateLabel: "Jue 21 may · 20:30 hs",
    spots: 20,
    startISO: "2026-05-21T20:30:00",
    endISO: "2026-05-21T23:00:00",
    image:
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&h=340",
  },
  {
    id: "4",
    title: "Mercado de Arte",
    venue: "Plaza Serrano",
    location: "Palermo, CABA",
    dateLabel: "Sáb 23 may · 11:00 hs",
    spots: 80,
    startISO: "2026-05-23T11:00:00",
    endISO: "2026-05-23T19:00:00",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&h=340",
  },
  {
    id: "5",
    title: "Stand Up Comedy",
    venue: "El Cotorro",
    location: "San Telmo, CABA",
    dateLabel: "Vie 29 may · 21:30 hs",
    spots: 3,
    startISO: "2026-05-29T21:30:00",
    endISO: "2026-05-29T23:30:00",
    image:
      "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=600&h=340",
  },
  {
    id: "6",
    title: "Cócteles con Historia",
    venue: "Bar Constitución",
    location: "Constitución, CABA",
    dateLabel: "Mié 27 may · 20:00 hs",
    spots: 18,
    startISO: "2026-05-27T20:00:00",
    endISO: "2026-05-27T23:00:00",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&h=340",
  },
];

function gCalLink(ev: DemoEvent) {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", ev.title);
  url.searchParams.set(
    "dates",
    `${fmt(new Date(ev.startISO))}/${fmt(new Date(ev.endISO))}`
  );
  url.searchParams.set("details", `${ev.venue} · ${ev.location}`);
  url.searchParams.set("location", `${ev.venue}, ${ev.location}`);
  return url.toString();
}

export function NearbyEvents() {
  const n = EVENTS.length;
  const [current, setCurrent] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const pauseRef = useRef(false);

  const advance = useCallback(() => {
    if (!pauseRef.current) setCurrent((c) => (c + 1) % n);
  }, [n]);

  useEffect(() => {
    const t = setInterval(advance, 4500);
    return () => clearInterval(t);
  }, [advance]);

  function go(dir: 1 | -1) {
    setCurrent((c) => (c + dir + n) % n);
    pauseRef.current = true;
    setTimeout(() => { pauseRef.current = false; }, 6000);
  }

  async function share(ev: DemoEvent) {
    const text = `${ev.title} · ${ev.dateLabel} · ${ev.venue}`;
    if (navigator.share) {
      try { await navigator.share({ title: ev.title, text }); return; } catch { /**/ }
    }
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(ev.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-zinc-100 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <MapPin className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
              Cerca tuyo
            </span>
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Eventos cerca tuyo</h3>
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="text-zinc-300 hover:text-zinc-600 transition-colors"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Siguiente"
            className="text-zinc-300 hover:text-zinc-600 transition-colors"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative overflow-hidden">
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((offset) => {
            const ev = EVENTS[(current + offset) % n];
            return (
              <div
                key={`${current}-${offset}`}
                className="shrink-0 w-[78%] sm:w-[45%] md:w-[30%]"
              >
                <EventCard ev={ev} copied={copied} onShare={share} />
              </div>
            );
          })}
        </div>

        {/* Right gradient fade for peek effect */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-28 bg-gradient-to-l from-white via-white/70 to-transparent" />
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        {EVENTS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); pauseRef.current = true; setTimeout(() => { pauseRef.current = false; }, 6000); }}
            aria-label={`Ir al evento ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-5 bg-violet-500" : "w-1.5 bg-zinc-200 hover:bg-zinc-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function EventCard({
  ev,
  copied,
  onShare,
}: {
  ev: DemoEvent;
  copied: string | null;
  onShare: (ev: DemoEvent) => void;
}) {
  const spotsClass =
    ev.spots <= 3
      ? "bg-red-100 text-red-700"
      : ev.spots <= 7
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white shadow-sm flex flex-col h-full">
      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ev.image}
        alt={ev.title}
        className="w-full h-36 sm:h-44 object-cover"
        loading="lazy"
      />

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h4 className="font-bold text-zinc-900 text-base leading-snug">{ev.title}</h4>

        <p className="text-sm font-medium text-zinc-600 truncate">{ev.venue}</p>

        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{ev.location}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{ev.dateLabel}</span>
        </div>

        <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${spotsClass}`}>
          {ev.spots === 1 ? "Queda 1 cupo" : `Quedan ${ev.spots} cupos`}
        </span>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <a
            href={gCalLink(ev)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition"
          >
            <Calendar className="h-3.5 w-3.5" />
            Agregar
          </a>
          <button
            onClick={() => onShare(ev)}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-50 transition"
          >
            <Share2 className="h-3.5 w-3.5" />
            {copied === ev.id ? "¡Copiado!" : "Compartir"}
          </button>
        </div>
      </div>
    </div>
  );
}
