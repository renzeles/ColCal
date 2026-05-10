"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar, Check, ChevronLeft, ChevronRight, Compass, Globe,
  Lock, Pencil, Trash2, User as UserIcon, UserPlus, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { SearchBar } from "@/components/SearchBar";
import { Toast, useToast } from "@/components/Toast";
import { Landing } from "@/components/Landing";
import { FeedSkeleton } from "@/components/Skeleton";
import { NearbyEvents } from "@/components/NearbyEvents";
import { getEventColorStyles } from "@/lib/event-colors";
import type { Profile, SentEvent } from "@/lib/types";
import type { DemoEvent } from "@/components/NearbyEvents";

type FeedItem = SentEvent & { creator: Profile };
type EventFilter = "public" | "private" | "mine";
type RsvpStatus = "accepted" | "declined";
type MainTab = "discover" | "events" | "calendar";

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Mini calendar (Descubrí tab) ────────────────────────────────────────────
function MiniCalendar({ events }: { events: FeedItem[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventDays = new Map<number, string>();
  events.forEach((ev) => {
    const d = new Date(ev.start_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      if (!eventDays.has(d.getDate())) eventDays.set(d.getDate(), ev.color ?? "violet");
    }
  });

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
      <p className="text-sm font-semibold text-zinc-700 mb-3 capitalize">
        {MONTHS_ES[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
          <div key={i} className="py-1 text-zinc-400 font-medium">{d}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day === today.getDate();
          const hasEvent = day !== null && eventDays.has(day);
          return (
            <div
              key={i}
              className={`relative py-1.5 rounded-lg font-medium
                ${isToday ? "bg-violet-600 text-white" : day ? "text-zinc-700" : ""}
              `}
            >
              {day}
              {hasEvent && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-violet-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Full calendar tab ────────────────────────────────────────────────────────
function CalendarTab({ events }: { events: FeedItem[] }) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  function shiftMonth(dir: 1 | -1) {
    setCalMonth((m) => {
      const next = m + dir;
      if (next < 0) { setCalYear((y) => y - 1); return 11; }
      if (next > 11) { setCalYear((y) => y + 1); return 0; }
      return next;
    });
    setSelectedDay(null);
  }

  const firstDow = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const eventsByDay = useMemo(() => {
    const map = new Map<number, FeedItem[]>();
    events.forEach((ev) => {
      const d = new Date(ev.start_at);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        map.set(day, [...(map.get(day) ?? []), ev]);
      }
    });
    return map;
  }, [events, calYear, calMonth]);

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];
  const isThisMonth = calYear === today.getFullYear() && calMonth === today.getMonth();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-zinc-800 capitalize">
            {MONTHS_ES[calMonth]} {calYear}
          </p>
          <button onClick={() => shiftMonth(1)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {DAYS_ES.map((d) => (
            <div key={d} className="py-1 text-zinc-400 font-medium">{d.slice(0, 1)}</div>
          ))}
          {cells.map((day, i) => {
            const isToday = isThisMonth && day === today.getDate();
            const isSelected = day === selectedDay;
            const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];
            return (
              <button
                key={i}
                disabled={!day}
                onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                className={`relative py-2 rounded-xl font-medium transition cursor-pointer
                  ${!day ? "invisible" : ""}
                  ${isSelected ? "bg-violet-600 text-white" : isToday ? "bg-violet-100 text-violet-700" : "text-zinc-700 hover:bg-zinc-100"}
                `}
              >
                {day}
                {dayEvents.length > 0 && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <span key={j} className="h-1 w-1 rounded-full bg-violet-500 inline-block" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day events */}
      {selectedDay && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 px-1">
            {DAYS_ES[new Date(calYear, calMonth, selectedDay).getDay()]} {selectedDay} de {MONTHS_ES[calMonth]}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8 bg-white rounded-2xl border border-zinc-200">
              Sin eventos este día.
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((ev) => {
                const evStyles = getEventColorStyles(ev.color);
                return (
                  <li key={ev.id} className={`rounded-2xl border overflow-hidden shadow-sm ${evStyles.card} ${evStyles.border}`}>
                    <Link href={`/u/${ev.creator.username}/e/${ev.id}`} className="flex items-start gap-3 p-4 cursor-pointer">
                      <Avatar src={ev.creator.avatar_url} name={ev.creator.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-zinc-900 truncate">{ev.title}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(ev.start_at)}
                        </p>
                        {ev.location && (
                          <p className="text-xs text-zinc-500 mt-0.5 truncate">📍 {ev.location}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Upcoming events list when no day selected */}
      {!selectedDay && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2 px-1">Próximos eventos</p>
          {events.filter((ev) => new Date(ev.start_at) >= today).length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8 bg-white rounded-2xl border border-zinc-200">
              No hay eventos próximos.
            </p>
          ) : (
            <ul className="space-y-2">
              {events
                .filter((ev) => new Date(ev.start_at) >= today)
                .sort((a, b) => a.start_at.localeCompare(b.start_at))
                .slice(0, 10)
                .map((ev) => {
                  const evStyles = getEventColorStyles(ev.color);
                  return (
                    <li key={ev.id} className={`rounded-2xl border overflow-hidden shadow-sm ${evStyles.card} ${evStyles.border}`}>
                      <Link href={`/u/${ev.creator.username}/e/${ev.id}`} className="flex items-start gap-3 p-4 cursor-pointer">
                        <Avatar src={ev.creator.avatar_url} name={ev.creator.full_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-zinc-900 truncate">{ev.title}</h3>
                          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(ev.start_at)}
                          </p>
                          {ev.location && (
                            <p className="text-xs text-zinc-500 mt-0.5 truncate">📍 {ev.location}</p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, loading: userLoading, signOut } = useUser(false);
  const toast = useToast();
  const router = useRouter();

  const [mainTab, setMainTab] = useState<MainTab>("discover");
  const [eventFilter, setEventFilter] = useState<EventFilter>("public");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [publicItems, setPublicItems] = useState<FeedItem[]>([]);
  const [privateItems, setPrivateItems] = useState<FeedItem[]>([]);
  const [mineItems, setMineItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [followingCount, setFollowingCount] = useState(0);
  const [followedSet, setFollowedSet] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  const [myRsvpMap, setMyRsvpMap] = useState<Map<string, RsvpStatus>>(new Map());
  const [rsvpCounts, setRsvpCounts] = useState<Map<string, number>>(new Map());
  const [rsvpBusy, setRsvpBusy] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      setLoading(true);

      const { data: follows } = await supabase
        .from("follows").select("following_id").eq("follower_id", user.id);
      const followedIds = (follows ?? []).map((f) => f.following_id);
      setFollowingCount(followedIds.length);
      setFollowedSet(new Set(followedIds));

      const privateQuery = user.email
        ? supabase.from("sent_events").select("*")
            .eq("visibility", "private")
            .contains("attendee_emails", [user.email])
            .neq("creator_id", user.id)
            .order("start_at", { ascending: false }).limit(100)
        : null;

      const publicQuery = followedIds.length > 0
        ? supabase.from("sent_events").select("*")
            .in("creator_id", followedIds)
            .eq("visibility", "public")
            .order("start_at", { ascending: false }).limit(100)
        : null;

      const mineQuery = supabase.from("sent_events").select("*")
        .eq("creator_id", user.id)
        .order("start_at", { ascending: false }).limit(100);

      const [publicRes, privateRes, mineRes] = await Promise.all([
        publicQuery ?? Promise.resolve({ data: [] as SentEvent[] }),
        privateQuery ?? Promise.resolve({ data: [] as SentEvent[] }),
        mineQuery,
      ]);

      const allCreatorIds = Array.from(new Set([
        ...((publicRes.data ?? []) as SentEvent[]).map((e) => e.creator_id),
        ...((privateRes.data ?? []) as SentEvent[]).map((e) => e.creator_id),
        ...((mineRes.data ?? []) as SentEvent[]).map((e) => e.creator_id),
      ]));

      const profileMap = new Map<string, Profile>();
      if (allCreatorIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("*").in("id", allCreatorIds);
        (profiles ?? []).forEach((p) => profileMap.set(p.id, p as Profile));
      }

      function withCreator(events: SentEvent[]): FeedItem[] {
        return events
          .map((e) => { const creator = profileMap.get(e.creator_id); return creator ? { ...e, creator } : null; })
          .filter((x): x is FeedItem => x !== null);
      }

      const resolvedPrivate = withCreator((privateRes.data ?? []) as SentEvent[]);
      const resolvedMine = withCreator((mineRes.data ?? []) as SentEvent[]);

      setPublicItems(withCreator((publicRes.data ?? []) as SentEvent[]));
      setPrivateItems(resolvedPrivate);
      setMineItems(resolvedMine);

      const privateEventIds = resolvedPrivate.map((e) => e.id);
      const mineEventIds = resolvedMine.map((e) => e.id);

      const [myRsvpsRes, acceptedRsvpsRes] = await Promise.all([
        privateEventIds.length > 0
          ? supabase.from("event_rsvps").select("event_id, status").eq("user_id", user.id).in("event_id", privateEventIds)
          : Promise.resolve({ data: [] }),
        mineEventIds.length > 0
          ? supabase.from("event_rsvps").select("event_id").eq("status", "accepted").in("event_id", mineEventIds)
          : Promise.resolve({ data: [] }),
      ]);

      setMyRsvpMap(new Map(
        ((myRsvpsRes.data ?? []) as { event_id: string; status: string }[]).map((r) => [r.event_id, r.status as RsvpStatus])
      ));
      const countsMap = new Map<string, number>();
      ((acceptedRsvpsRes.data ?? []) as { event_id: string }[]).forEach((r) => {
        countsMap.set(r.event_id, (countsMap.get(r.event_id) ?? 0) + 1);
      });
      setRsvpCounts(countsMap);
      setLoading(false);
    })();
  }, [user]);

  async function rsvp(eventId: string, status: RsvpStatus) {
    if (!user || rsvpBusy) return;
    setRsvpBusy(eventId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("event_rsvps").upsert({ event_id: eventId, user_id: user.id, status });
      if (error) throw error;
      setMyRsvpMap((prev) => new Map(prev).set(eventId, status));
    } catch {
      toast.show("error", "No se pudo guardar tu respuesta.");
    } finally {
      setRsvpBusy(null);
    }
  }

  async function quickFollow(profileId: string) {
    if (!user || followBusy) return;
    setFollowBusy(profileId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: profileId });
      if (error) throw error;
      setFollowedSet((prev) => new Set(prev).add(profileId));
      setFollowingCount((c) => c + 1);
    } catch {
      toast.show("error", "No se pudo seguir.");
    } finally {
      setFollowBusy(null);
    }
  }

  async function deleteMineEvent(evId: string, title: string) {
    if (deletingId || !confirm(`¿Borrar "${title}"?`)) return;
    setDeletingId(evId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("sent_events").delete().eq("id", evId);
      if (error) throw error;
      setMineItems((prev) => prev.filter((e) => e.id !== evId));
    } catch {
      toast.show("error", "No se pudo borrar el evento.");
    } finally {
      setDeletingId(null);
    }
  }

  async function addDemoEvent(ev: DemoEvent) {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("sent_events").insert({
        creator_id: user.id,
        title: ev.title,
        start_at: ev.startISO,
        end_at: ev.endISO,
        location: `${ev.venue}, ${ev.location}`,
        description: null,
        attendee_emails: [],
        provider: "google",
        provider_event_id: null,
        visibility: "public",
        image_url: ev.image,
        color: "violet",
      }).select("*").single();
      if (error) throw error;
      const creator = user.profile as Profile;
      setMineItems((prev) => [{ ...(data as SentEvent), creator }, ...prev]);
      toast.show("success", `"${ev.title}" agregado a Mis eventos.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? "";
      toast.show("error", msg ? `Error: ${msg}` : "No se pudo agregar el evento.");
    }
  }

  const filteredItems = useMemo(() => {
    const base = eventFilter === "public" ? publicItems : eventFilter === "private" ? privateItems : mineItems;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((ev) =>
      ev.title.toLowerCase().includes(q) ||
      (ev.description ?? "").toLowerCase().includes(q) ||
      (ev.location ?? "").toLowerCase().includes(q) ||
      (ev.creator.username ?? "").toLowerCase().includes(q) ||
      (ev.creator.full_name ?? "").toLowerCase().includes(q)
    );
  }, [eventFilter, publicItems, privateItems, mineItems, query]);

  const allMyEvents = useMemo(() => [...mineItems, ...privateItems], [mineItems, privateItems]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Cargando…</div>
      </div>
    );
  }

  if (!user) return <Landing />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <NavBar
        username={user.profile.username}
        fullName={user.profile.full_name}
        avatarUrl={user.profile.avatar_url}
        onSignOut={signOut}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Main tab bar */}
        <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1">
          <button
            onClick={() => setMainTab("discover")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              mainTab === "discover" ? "bg-violet-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Compass className="h-4 w-4" /> Descubrí
          </button>
          <button
            onClick={() => setMainTab("events")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              mainTab === "events" ? "bg-violet-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Globe className="h-4 w-4" /> Eventos
          </button>
          <button
            onClick={() => setMainTab("calendar")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              mainTab === "calendar" ? "bg-violet-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Calendar className="h-4 w-4" /> Calendario
          </button>
        </div>

        {/* ── Descubrí tab ── */}
        {mainTab === "discover" && (
          <div className="space-y-4">
            <NearbyEvents onAdd={addDemoEvent} />
            <MiniCalendar events={allMyEvents} />
          </div>
        )}

        {/* ── Eventos tab ── */}
        {mainTab === "events" && (
          <>
            <SearchBar value={query} onChange={setQuery} placeholder="Buscar eventos…" />

            <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1 overflow-x-auto">
              <button
                onClick={() => setEventFilter("public")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap cursor-pointer ${
                  eventFilter === "public" ? "bg-violet-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Globe className="h-4 w-4" /> Públicos ({publicItems.length})
              </button>
              <button
                onClick={() => setEventFilter("private")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap cursor-pointer ${
                  eventFilter === "private" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Lock className="h-4 w-4" /> Privados ({privateItems.length})
              </button>
              <button
                onClick={() => setEventFilter("mine")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap cursor-pointer ${
                  eventFilter === "mine" ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <UserIcon className="h-4 w-4" /> Míos ({mineItems.length})
              </button>
            </div>

            {loading ? (
              <FeedSkeleton />
            ) : filteredItems.length === 0 ? (
              <div className="text-sm text-zinc-500 text-center py-12 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                {query.trim() ? (
                  "Sin resultados para tu búsqueda."
                ) : eventFilter === "public" ? (
                  followingCount === 0 ? (
                    <>
                      <p className="mb-1">No estás siguiendo a nadie todavía.</p>
                      <p className="text-xs">Buscá perfiles y seguilos para ver sus eventos públicos.</p>
                    </>
                  ) : (
                    "Las personas que seguís no publicaron eventos todavía."
                  )
                ) : eventFilter === "private" ? (
                  "No te invitaron a ningún evento privado todavía."
                ) : (
                  <>
                    <p className="mb-1">Todavía no creaste ningún evento.</p>
                    <Link href="/create" className="text-xs text-blue-600 hover:underline cursor-pointer">
                      Creá tu primer evento →
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredItems.map((ev) => {
                  const evStyles = getEventColorStyles(ev.color);
                  const myRsvp = myRsvpMap.get(ev.id);
                  const acceptedCount = rsvpCounts.get(ev.id) ?? 0;
                  const isFollowingCreator = followedSet.has(ev.creator_id);

                  return (
                    <li
                      key={ev.id}
                      className={`rounded-2xl border overflow-hidden hover:shadow-md transition shadow-sm ${evStyles.card} ${evStyles.border}`}
                    >
                      {ev.image_url && (
                        <Link href={`/u/${ev.creator.username}/e/${ev.id}`} className="cursor-pointer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ev.image_url} alt={ev.title} className="w-full h-48 object-cover" />
                        </Link>
                      )}
                      <div className="flex items-start gap-3 p-4">
                        <Link href={`/u/${ev.creator.username}`} className="cursor-pointer">
                          <Avatar src={ev.creator.avatar_url} name={ev.creator.full_name} size="md" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <Link
                                href={`/u/${ev.creator.username}`}
                                className="font-medium text-zinc-900 hover:underline truncate cursor-pointer"
                              >
                                {ev.creator.full_name ?? ev.creator.username}
                              </Link>
                              <span className="text-xs text-zinc-400 shrink-0">@{ev.creator.username}</span>
                            </div>
                            {eventFilter === "private" && !isFollowingCreator && (
                              <button
                                onClick={() => quickFollow(ev.creator_id)}
                                disabled={followBusy === ev.creator_id}
                                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 cursor-pointer"
                              >
                                <UserPlus className="h-3 w-3" /> Seguir
                              </button>
                            )}
                            {eventFilter === "mine" && (
                              <div className="flex items-center gap-1 shrink-0">
                                {acceptedCount > 0 && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                    <Check className="h-3 w-3" />
                                    {acceptedCount} {acceptedCount === 1 ? "confirmó" : "confirmaron"}
                                  </span>
                                )}
                                <button
                                  onClick={() => router.push(`/create?edit=${ev.id}`)}
                                  aria-label="Editar"
                                  className="h-7 w-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteMineEvent(ev.id, ev.title)}
                                  disabled={deletingId === ev.id}
                                  aria-label="Borrar"
                                  className="h-7 w-7 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/u/${ev.creator.username}/e/${ev.id}`}
                            className="block hover:underline cursor-pointer"
                          >
                            <h3 className="font-medium text-zinc-900 mt-1.5">{ev.title}</h3>
                          </Link>
                          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(ev.start_at)}
                          </p>
                          {ev.location && <p className="text-xs text-zinc-500 mt-0.5">📍 {ev.location}</p>}
                          {ev.description && (
                            <p className="text-sm text-zinc-700 mt-2 whitespace-pre-line line-clamp-3">{ev.description}</p>
                          )}
                          {eventFilter === "private" && (
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                onClick={() => rsvp(ev.id, "accepted")}
                                disabled={rsvpBusy === ev.id}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-60 cursor-pointer ${
                                  myRsvp === "accepted"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                }`}
                              >
                                <Check className="h-3 w-3" />
                                {myRsvp === "accepted" ? "Confirmado" : "Confirmar"}
                              </button>
                              <button
                                onClick={() => rsvp(ev.id, "declined")}
                                disabled={rsvpBusy === ev.id}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-60 cursor-pointer ${
                                  myRsvp === "declined"
                                    ? "bg-zinc-700 text-white"
                                    : "bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                                }`}
                              >
                                <X className="h-3 w-3" />
                                {myRsvp === "declined" ? "No puedo" : "No puedo ir"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* ── Calendario tab ── */}
        {mainTab === "calendar" && (
          loading ? <FeedSkeleton /> : <CalendarTab events={allMyEvents} />
        )}
      </main>

      <Toast state={toast.state} />
    </div>
  );
}
