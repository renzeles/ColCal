"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, MapPin, Share2, Users, X } from "lucide-react";

export type DemoEvent = {
  id: string;
  title: string;
  venue: string;
  location: string;
  dateLabel: string;
  timeLabel: string;
  image: string;
  startISO: string;
  endISO: string;
  spots: number;
  attendees: string[];
};

const EVENTS: DemoEvent[] = [
  {
    id: "1",
    title: "Chef en Vivo",
    venue: "La Parrilla del Puerto",
    location: "Puerto Madero, CABA",
    dateLabel: "Sáb 16 may",
    timeLabel: "21:00 hs",
    spots: 12,
    attendees: ["Martina R.", "Lucas F.", "Sofía M.", "Andrés P."],
    startISO: "2026-05-16T21:00:00",
    endISO: "2026-05-16T23:30:00",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&h=500",
  },
  {
    id: "2",
    title: "Rolling Stones Tribute",
    venue: "Bar Hood",
    location: "Palermo, CABA",
    dateLabel: "Dom 17 may",
    timeLabel: "22:00 hs",
    spots: 5,
    attendees: ["Valentina G.", "Tomás K."],
    startISO: "2026-05-17T22:00:00",
    endISO: "2026-05-18T01:00:00",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&h=500",
  },
  {
    id: "3",
    title: "Noche de Jazz",
    venue: "Club del Vino",
    location: "Chacarita, CABA",
    dateLabel: "Jue 21 may",
    timeLabel: "20:30 hs",
    spots: 20,
    attendees: ["Camila B.", "Ignacio W.", "Florencia D.", "Ramiro S.", "Paula T."],
    startISO: "2026-05-21T20:30:00",
    endISO: "2026-05-21T23:00:00",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&h=500",
  },
  {
    id: "4",
    title: "Mercado de Arte",
    venue: "Plaza Serrano",
    location: "Palermo, CABA",
    dateLabel: "Sáb 23 may",
    timeLabel: "11:00 hs",
    spots: 80,
    attendees: ["Elena C.", "Nicolás H.", "Agustina L."],
    startISO: "2026-05-23T11:00:00",
    endISO: "2026-05-23T19:00:00",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&h=500",
  },
  {
    id: "5",
    title: "Stand Up Comedy",
    venue: "El Cotorro",
    location: "San Telmo, CABA",
    dateLabel: "Vie 29 may",
    timeLabel: "21:30 hs",
    spots: 3,
    attendees: ["Diego M.", "Carolina V."],
    startISO: "2026-05-29T21:30:00",
    endISO: "2026-05-29T23:30:00",
    image: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=800&h=500",
  },
  {
    id: "6",
    title: "Cócteles con Historia",
    venue: "Bar Constitución",
    location: "Constitución, CABA",
    dateLabel: "Mié 27 may",
    timeLabel: "20:00 hs",
    spots: 18,
    attendees: ["Julieta P.", "Marcos N.", "Renata A.", "Bruno E."],
    startISO: "2026-05-27T20:00:00",
    endISO: "2026-05-27T23:00:00",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&h=500",
  },
];

function gCalLink(ev: DemoEvent) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", ev.title);
  url.searchParams.set("dates", `${fmt(new Date(ev.startISO))}/${fmt(new Date(ev.endISO))}`);
  url.searchParams.set("details", `${ev.venue} · ${ev.location}`);
  url.searchParams.set("location", `${ev.venue}, ${ev.location}`);
  return url.toString();
}

const AVATAR_COLORS = [
  "bg-teal-600", "bg-sky-500", "bg-emerald-500",
  "bg-amber-500", "bg-pink-500", "bg-orange-500", "bg-blue-500",
];

function nameColor(name: string) {
  const code = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function EventDetailModal({
  ev,
  onClose,
  copied,
  onShare,
  onAdd,
}: {
  ev: DemoEvent;
  onClose: () => void;
  copied: string | null;
  onShare: (ev: DemoEvent) => void;
  onAdd?: (ev: DemoEvent) => void;
}) {
  const spotsClass =
    ev.spots <= 3
      ? "bg-red-100 text-red-700"
      : ev.spots <= 7
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ev.image} alt={ev.title} className="w-full h-52 sm:h-64 object-cover" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 space-y-4">
          <h3 className="text-2xl font-bold text-zinc-900 leading-tight">{ev.title}</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Calendar className="h-4 w-4 text-teal-600 shrink-0" />
              <span>{ev.dateLabel} · {ev.timeLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
              <span>{ev.venue} · {ev.location}</span>
            </div>
          </div>

          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${spotsClass}`}>
            {ev.spots === 1 ? "Queda 1 cupo" : `Quedan ${ev.spots} cupos`}
          </span>

          {ev.attendees.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Users className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-semibold text-zinc-700">
                  {ev.attendees.length} {ev.attendees.length === 1 ? "persona va" : "personas van"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ev.attendees.map((name) => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div
                      className={`h-10 w-10 rounded-full ${nameColor(name)} flex items-center justify-center text-white text-xs font-bold`}
                      title={name}
                    >
                      {initials(name)}
                    </div>
                    <span className="text-[10px] text-zinc-500 max-w-[40px] text-center leading-tight truncate">
                      {name.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {onAdd ? (
              <button
                onClick={() => { onAdd(ev); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                Agregar a Agenddi
              </button>
            ) : (
              <a
                href={gCalLink(ev)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                Agregar al calendario
              </a>
            )}
            <button
              onClick={() => onShare(ev)}
              className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
              aria-label="Compartir"
            >
              <Share2 className="h-4 w-4" />
              {copied === ev.id && (
                <span className="ml-1.5 text-xs font-medium">¡Copiado!</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NearbyEvents({ onAdd }: { onAdd?: (ev: DemoEvent) => void }) {
  const n = EVENTS.length;
  const [current, setCurrent] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<DemoEvent | null>(null);
  const pauseRef = useRef(false);

  const advance = useCallback(() => {
    if (!pauseRef.current) setCurrent((c) => (c + 1) % n);
  }, [n]);

  useEffect(() => {
    const t = setInterval(advance, 4500);
    return () => clearInterval(t);
  }, [advance]);

  useEffect(() => {
    pauseRef.current = selected !== null;
  }, [selected]);

  function go(dir: 1 | -1) {
    setCurrent((c) => (c + dir + n) % n);
    pauseRef.current = true;
    setTimeout(() => { if (!selected) pauseRef.current = false; }, 6000);
  }

  async function share(ev: DemoEvent) {
    const text = `${ev.title} · ${ev.dateLabel} · ${ev.timeLabel} · ${ev.venue}`;
    if (navigator.share) {
      try { await navigator.share({ title: ev.title, text }); return; } catch { /**/ }
    }
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(ev.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <section className="bg-white rounded-3xl card-shadow p-6 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <MapPin className="h-3.5 w-3.5 text-teal-600" />
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Cerca tuyo</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Eventos cerca tuyo</h3>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => go(-1)} aria-label="Anterior" className="text-zinc-300 hover:text-zinc-600 transition-colors cursor-pointer">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button onClick={() => go(1)} aria-label="Siguiente" className="text-zinc-300 hover:text-zinc-600 transition-colors cursor-pointer">
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((offset) => {
              const ev = EVENTS[(current + offset) % n];
              return (
                <div key={`${current}-${offset}`} className="shrink-0 w-[78%] sm:w-[45%] md:w-[30%]">
                  <EventCard ev={ev} copied={copied} onShare={share} onOpen={() => setSelected(ev)} onAdd={onAdd} />
                </div>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-28 bg-gradient-to-l from-white via-white/70 to-transparent" />
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5">
          {EVENTS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); pauseRef.current = true; setTimeout(() => { if (!selected) pauseRef.current = false; }, 6000); }}
              aria-label={`Ir al evento ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === current ? "w-5 bg-teal-600" : "w-1.5 bg-zinc-200 hover:bg-zinc-300"}`}
            />
          ))}
        </div>
      </section>

      {selected && (
        <EventDetailModal
          ev={selected}
          onClose={() => setSelected(null)}
          copied={copied}
          onShare={share}
          onAdd={onAdd}
        />
      )}
    </>
  );
}

function EventCard({
  ev,
  copied,
  onShare,
  onOpen,
  onAdd,
}: {
  ev: DemoEvent;
  copied: string | null;
  onShare: (ev: DemoEvent) => void;
  onOpen: () => void;
  onAdd?: (ev: DemoEvent) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white card-shadow flex flex-col h-full">
      <button className="text-left w-full cursor-pointer" onClick={onOpen}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ev.image} alt={ev.title} className="w-full h-36 sm:h-44 object-cover" loading="lazy" />
        <div className="px-4 pt-3 pb-2">
          <h4 className="font-bold text-zinc-900 text-base leading-snug">{ev.title}</h4>
          <p className="text-sm font-medium text-zinc-600 truncate mt-0.5">{ev.venue}</p>
          <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{ev.location}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{ev.dateLabel} · {ev.timeLabel}</span>
          </div>
        </div>
      </button>

      <div className="flex gap-2 px-4 pb-4 mt-auto">
        {onAdd ? (
          <button
            onClick={() => onAdd(ev)}
            className="flex-1 flex items-center justify-center py-2 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition cursor-pointer"
            aria-label="Agregar a Agenddi"
          >
            +
          </button>
        ) : (
          <a
            href={gCalLink(ev)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center py-2 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition cursor-pointer"
            aria-label="Agregar al calendario"
          >
            +
          </a>
        )}
        <button
          onClick={() => onShare(ev)}
          className="flex items-center justify-center px-3 py-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
          aria-label="Compartir"
        >
          {copied === ev.id
            ? <span className="text-xs font-medium px-1">¡Copiado!</span>
            : <Share2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
