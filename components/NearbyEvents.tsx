"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Navigation, Search, X, AlertCircle, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateDistanceKm } from "@/lib/geo";
import { Skeleton } from "@/components/Skeleton";
import { getEventColorStyles } from "@/lib/event-colors";
import type { Profile, SentEvent } from "@/lib/types";

type BaseEvent = SentEvent & { creator: Profile };
type GeoEvent = BaseEvent & { distanceKm: number };

type State =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "loading" }
  | { kind: "success"; lat: number; lng: number }
  | { kind: "denied" }
  | { kind: "error" }
  | { kind: "manual" };

const RADII = [2, 5, 10, 25] as const;
type Radius = (typeof RADII)[number];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }),
    time: d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  };
}

async function loadGeoEvents(): Promise<BaseEvent[]> {
  const supabase = createClient();
  const { data: evs } = await supabase
    .from("sent_events")
    .select("*")
    .eq("visibility", "public")
    .eq("is_online", false)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(300);

  if (!evs?.length) return [];

  const ids = [...new Set((evs as SentEvent[]).map((e) => e.creator_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", ids);

  const pm = new Map<string, Profile>((profiles ?? []).map((p) => [p.id, p as Profile]));
  return (evs as SentEvent[])
    .map((e) => (pm.get(e.creator_id) ? { ...e, creator: pm.get(e.creator_id)! } : null))
    .filter((e): e is BaseEvent => e !== null);
}

async function searchByCity(q: string): Promise<BaseEvent[]> {
  if (!q.trim()) return [];
  const supabase = createClient();
  const { data: evs } = await supabase
    .from("sent_events")
    .select("*")
    .eq("visibility", "public")
    .eq("is_online", false)
    .gte("start_at", new Date().toISOString())
    .ilike("location", `%${q.trim()}%`)
    .order("start_at", { ascending: true })
    .limit(50);

  if (!evs?.length) return [];

  const ids = [...new Set((evs as SentEvent[]).map((e) => e.creator_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", ids);

  const pm = new Map<string, Profile>((profiles ?? []).map((p) => [p.id, p as Profile]));
  return (evs as SentEvent[])
    .map((e) => (pm.get(e.creator_id) ? { ...e, creator: pm.get(e.creator_id)! } : null))
    .filter((e): e is BaseEvent => e !== null);
}

export function NearbyEvents() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [radius, setRadius] = useState<Radius>(10);
  const [allGeo, setAllGeo] = useState<BaseEvent[]>([]);
  const [manualQ, setManualQ] = useState("");
  const [manualEvs, setManualEvs] = useState<BaseEvent[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function useLocation() {
    if (!navigator.geolocation) {
      setState({ kind: "error" });
      return;
    }
    setState({ kind: "requesting" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState({ kind: "loading" });
        const evs = await loadGeoEvents();
        setAllGeo(evs);
        setState({ kind: "success", lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => setState({ kind: err.code === 1 ? "denied" : "error" }),
      { timeout: 10000, maximumAge: 300_000 }
    );
  }

  useEffect(() => {
    if (state.kind !== "manual") return;
    if (timer.current) clearTimeout(timer.current);
    if (!manualQ.trim()) { setManualEvs([]); setManualLoading(false); return; }
    setManualLoading(true);
    timer.current = setTimeout(async () => {
      const res = await searchByCity(manualQ);
      setManualEvs(res);
      setManualLoading(false);
    }, 380);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [manualQ, state.kind]);

  const nearby = useMemo((): GeoEvent[] => {
    if (state.kind !== "success") return [];
    return allGeo
      .filter((e) => e.capacity === null || e.capacity > 0)
      .map((e) => ({
        ...e,
        distanceKm: calculateDistanceKm(state.lat, state.lng, e.latitude!, e.longitude!),
      }))
      .filter((e) => e.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm || new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [state, allGeo, radius]);

  function reset() {
    setState({ kind: "idle" });
    setManualQ("");
    setManualEvs([]);
  }

  const isBlocked = state.kind === "denied" || state.kind === "error";

  return (
    <section className="rounded-3xl bg-gradient-to-br from-violet-50 to-blue-50/60 border border-violet-100 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="h-5 w-5 text-violet-600 shrink-0" />
        <h3 className="text-lg font-bold text-zinc-900">Eventos cerca tuyo</h3>
      </div>
      <p className="text-sm text-zinc-500 mb-6">
        Encontrá eventos presenciales disponibles en tu zona.
      </p>

      {/* IDLE */}
      {state.kind === "idle" && (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <button
            onClick={useLocation}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-violet-600 text-white font-semibold text-base hover:bg-violet-700 active:scale-95 transition shadow-lg shadow-violet-200 w-full sm:w-auto justify-center"
          >
            <Navigation className="h-5 w-5" />
            Usar mi ubicación
          </button>
          <p className="text-xs text-zinc-400 max-w-xs">
            No guardamos tu ubicación exacta. Solo la usamos para mostrarte eventos cercanos.
          </p>
          <button
            onClick={() => setState({ kind: "manual" })}
            className="text-sm text-violet-600 hover:underline transition"
          >
            Elegí ciudad o barrio manualmente →
          </button>
        </div>
      )}

      {/* REQUESTING */}
      {state.kind === "requesting" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-10 w-10 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
          <p className="text-sm text-zinc-500">Esperando permiso de ubicación…</p>
          <p className="text-xs text-zinc-400">Aceptá el permiso en tu navegador para continuar.</p>
        </div>
      )}

      {/* LOADING */}
      {state.kind === "loading" && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500 mb-2">Buscando eventos cerca tuyo…</p>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* DENIED / ERROR */}
      {isBlocked && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-zinc-800">
                {state.kind === "denied"
                  ? "No pudimos acceder a tu ubicación."
                  : "Tu dispositivo no soporta geolocalización."}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Podés elegir una ciudad o barrio manualmente para ver eventos disponibles.
              </p>
            </div>
          </div>
          <button
            onClick={() => setState({ kind: "manual" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition"
          >
            <Search className="h-4 w-4" />
            Elegí ciudad o barrio
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {state.kind === "success" && (
        <div className="space-y-4">
          {/* Radius + reset */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <span className="text-xs text-zinc-500 shrink-0">Radio:</span>
            {RADII.map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  radius === r ? "bg-violet-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                {r} km
              </button>
            ))}
            <button
              onClick={reset}
              className="shrink-0 ml-auto flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition"
            >
              <X className="h-3.5 w-3.5" /> Cambiar
            </button>
          </div>

          {nearby.length === 0 ? (
            <EmptyNearby
              canExpand={radius < 25}
              onExpand={() => setRadius(RADII[Math.min(RADII.indexOf(radius) + 1, RADII.length - 1)])}
              onReset={() => setState({ kind: "manual" })}
            />
          ) : (
            <ul className="space-y-3">
              {nearby.map((ev) => (
                <EventCard key={ev.id} ev={ev} distanceKm={ev.distanceKm} />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* MANUAL */}
      {state.kind === "manual" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={manualQ}
              onChange={(e) => setManualQ(e.target.value)}
              placeholder="Ej: Palermo, Belgrano, CABA, Córdoba…"
              autoFocus
              className="w-full pl-9 pr-9 py-3 rounded-xl border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
            {manualQ && (
              <button
                onClick={() => setManualQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!manualQ.trim() && (
            <p className="text-xs text-zinc-400 text-center py-4">
              Ejemplos: Palermo · Belgrano · Recoleta · CABA · Córdoba · Rosario
            </p>
          )}

          {manualLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          )}

          {!manualLoading && manualQ.trim() && manualEvs.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-zinc-200">
              <p className="text-sm font-medium text-zinc-700 mb-1">
                No encontramos eventos en esa zona.
              </p>
              <p className="text-xs text-zinc-400">Probá con otra ciudad o barrio.</p>
            </div>
          )}

          {!manualLoading && manualEvs.length > 0 && (
            <ul className="space-y-3">
              {manualEvs.map((ev) => (
                <EventCard key={ev.id} ev={ev} distanceKm={null} />
              ))}
            </ul>
          )}

          <button onClick={reset} className="text-xs text-zinc-400 hover:text-zinc-600 transition">
            ← Volver
          </button>
        </div>
      )}
    </section>
  );
}

function EventCard({ ev, distanceKm }: { ev: BaseEvent; distanceKm: number | null }) {
  const { date, time } = fmtDate(ev.start_at);
  const evStyles = getEventColorStyles(ev.color);
  const spots = ev.capacity;
  const spotsClass =
    spots === null
      ? ""
      : spots <= 3
      ? "bg-red-100 text-red-700"
      : spots <= 7
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <li className={`rounded-2xl border overflow-hidden shadow-sm ${evStyles.card} ${evStyles.border}`}>
      {ev.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ev.image_url} alt={ev.title} className="w-full h-36 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-zinc-900 text-base leading-snug flex-1">{ev.title}</h4>
          {distanceKm !== null && (
            <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
              A {distanceKm} km
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-500 capitalize">
          {date} · {time} hs
        </p>
        {ev.location && (
          <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {ev.location}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 gap-2">
          {spots !== null ? (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${spotsClass}`}>
              {spots === 1 ? "Queda 1 cupo" : `Quedan ${spots} cupos`}
            </span>
          ) : (
            <span />
          )}
          <Link
            href={`/u/${ev.creator.username ?? ev.creator_id}/e/${ev.id}`}
            className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-700 transition"
          >
            Ver detalle <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </li>
  );
}

function EmptyNearby({
  canExpand,
  onExpand,
  onReset,
}: {
  canExpand: boolean;
  onExpand: () => void;
  onReset: () => void;
}) {
  return (
    <div className="text-center py-10 bg-white rounded-2xl border border-zinc-200">
      <p className="text-2xl mb-3">🗺️</p>
      <p className="text-sm font-medium text-zinc-800 mb-1">
        No encontramos eventos disponibles cerca tuyo.
      </p>
      <p className="text-xs text-zinc-500 mb-5">
        Probá ampliar el radio de búsqueda o elegir otra zona.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        {canExpand && (
          <button
            onClick={onExpand}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition"
          >
            Ampliar radio
          </button>
        )}
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-sm font-semibold hover:bg-zinc-200 transition"
        >
          Elegir otra ubicación
        </button>
      </div>
    </div>
  );
}
