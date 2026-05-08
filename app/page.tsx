"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Check, Globe, Lock, User as UserIcon, UserPlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { SearchBar } from "@/components/SearchBar";
import { Toast, useToast } from "@/components/Toast";
import { Landing } from "@/components/Landing";
import { FeedSkeleton } from "@/components/Skeleton";
import { getEventColorStyles } from "@/lib/event-colors";
import type { Profile, SentEvent } from "@/lib/types";

type FeedItem = SentEvent & { creator: Profile };
type Filter = "public" | "private" | "mine";
type RsvpStatus = "accepted" | "declined";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const { user, loading: userLoading, signOut } = useUser(false);
  const toast = useToast();
  const [publicItems, setPublicItems] = useState<FeedItem[]>([]);
  const [privateItems, setPrivateItems] = useState<FeedItem[]>([]);
  const [mineItems, setMineItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);
  const [followedSet, setFollowedSet] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("public");
  const [query, setQuery] = useState("");
  // RSVP: my status per event (for Privados tab)
  const [myRsvpMap, setMyRsvpMap] = useState<Map<string, RsvpStatus>>(new Map());
  // Accepted counts for my events (for Míos tab)
  const [rsvpCounts, setRsvpCounts] = useState<Map<string, number>>(new Map());
  const [rsvpBusy, setRsvpBusy] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      setLoading(true);

      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followedIds = (follows ?? []).map((f) => f.following_id);
      setFollowingCount(followedIds.length);
      setFollowedSet(new Set(followedIds));

      const privateQuery = user.email
        ? supabase
            .from("sent_events")
            .select("*")
            .eq("visibility", "private")
            .contains("attendee_emails", [user.email])
            .neq("creator_id", user.id)
            .order("start_at", { ascending: false })
            .limit(100)
        : null;

      const publicQuery =
        followedIds.length > 0
          ? supabase
              .from("sent_events")
              .select("*")
              .in("creator_id", followedIds)
              .eq("visibility", "public")
              .order("start_at", { ascending: false })
              .limit(100)
          : null;

      const mineQuery = supabase
        .from("sent_events")
        .select("*")
        .eq("creator_id", user.id)
        .order("start_at", { ascending: false })
        .limit(100);

      const [publicRes, privateRes, mineRes] = await Promise.all([
        publicQuery ?? Promise.resolve({ data: [] as SentEvent[] }),
        privateQuery ?? Promise.resolve({ data: [] as SentEvent[] }),
        mineQuery,
      ]);

      const allCreatorIds = Array.from(
        new Set([
          ...((publicRes.data ?? []) as SentEvent[]).map((e) => e.creator_id),
          ...((privateRes.data ?? []) as SentEvent[]).map((e) => e.creator_id),
          ...((mineRes.data ?? []) as SentEvent[]).map((e) => e.creator_id),
        ])
      );

      const profileMap = new Map<string, Profile>();
      if (allCreatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .in("id", allCreatorIds);
        (profiles ?? []).forEach((p) => profileMap.set(p.id, p as Profile));
      }

      function withCreator(events: SentEvent[]): FeedItem[] {
        return events
          .map((e) => {
            const creator = profileMap.get(e.creator_id);
            if (!creator) return null;
            return { ...e, creator };
          })
          .filter((x): x is FeedItem => x !== null);
      }

      const privateItems = withCreator((privateRes.data ?? []) as SentEvent[]);
      const mineItems = withCreator((mineRes.data ?? []) as SentEvent[]);

      setPublicItems(withCreator((publicRes.data ?? []) as SentEvent[]));
      setPrivateItems(privateItems);
      setMineItems(mineItems);

      // Fetch my RSVPs for private events I'm invited to
      const privateEventIds = privateItems.map((e) => e.id);
      const mineEventIds = mineItems.map((e) => e.id);

      const [myRsvpsRes, acceptedRsvpsRes] = await Promise.all([
        privateEventIds.length > 0
          ? supabase
              .from("event_rsvps")
              .select("event_id, status")
              .eq("user_id", user.id)
              .in("event_id", privateEventIds)
          : Promise.resolve({ data: [] }),
        mineEventIds.length > 0
          ? supabase
              .from("event_rsvps")
              .select("event_id")
              .eq("status", "accepted")
              .in("event_id", mineEventIds)
          : Promise.resolve({ data: [] }),
      ]);

      const rsvpMap = new Map<string, RsvpStatus>(
        ((myRsvpsRes.data ?? []) as { event_id: string; status: string }[]).map((r) => [
          r.event_id,
          r.status as RsvpStatus,
        ])
      );
      const countsMap = new Map<string, number>();
      ((acceptedRsvpsRes.data ?? []) as { event_id: string }[]).forEach((r) => {
        countsMap.set(r.event_id, (countsMap.get(r.event_id) ?? 0) + 1);
      });

      setMyRsvpMap(rsvpMap);
      setRsvpCounts(countsMap);
      setLoading(false);
    })();
  }, [user]);

  async function rsvp(eventId: string, status: RsvpStatus) {
    if (!user || rsvpBusy) return;
    setRsvpBusy(eventId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("event_rsvps")
        .upsert({ event_id: eventId, user_id: user.id, status });
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
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: profileId });
      if (error) throw error;
      setFollowedSet((prev) => new Set(prev).add(profileId));
      setFollowingCount((c) => c + 1);
    } catch {
      toast.show("error", "No se pudo seguir.");
    } finally {
      setFollowBusy(null);
    }
  }

  const items = useMemo(() => {
    const base =
      filter === "public" ? publicItems : filter === "private" ? privateItems : mineItems;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        (ev.description ?? "").toLowerCase().includes(q) ||
        (ev.location ?? "").toLowerCase().includes(q) ||
        (ev.creator.username ?? "").toLowerCase().includes(q) ||
        (ev.creator.full_name ?? "").toLowerCase().includes(q)
    );
  }, [filter, publicItems, privateItems, mineItems, query]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Cargando…</div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <NavBar
        username={user.profile.username}
        fullName={user.profile.full_name}
        avatarUrl={user.profile.avatar_url}
        onSignOut={signOut}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-lg font-semibold text-zinc-900">Eventos</h1>

        <SearchBar value={query} onChange={setQuery} placeholder="Buscar eventos…" />

        <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1 overflow-x-auto">
          <button
            onClick={() => setFilter("public")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              filter === "public" ? "bg-violet-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Globe className="h-4 w-4" /> Públicos ({publicItems.length})
          </button>
          <button
            onClick={() => setFilter("private")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              filter === "private" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Lock className="h-4 w-4" /> Privados ({privateItems.length})
          </button>
          <button
            onClick={() => setFilter("mine")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              filter === "mine" ? "bg-blue-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <UserIcon className="h-4 w-4" /> Míos ({mineItems.length})
          </button>
        </div>

        {loading ? (
          <FeedSkeleton />
        ) : items.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-12 bg-white rounded-2xl border border-zinc-200 shadow-sm">
            {query.trim() ? (
              "Sin resultados para tu búsqueda."
            ) : filter === "public" ? (
              followingCount === 0 ? (
                <>
                  <p className="mb-1">No estás siguiendo a nadie todavía.</p>
                  <p className="text-xs">Buscá perfiles y seguilos para ver sus eventos públicos.</p>
                </>
              ) : (
                "Las personas que seguís no publicaron eventos todavía."
              )
            ) : filter === "private" ? (
              "No te invitaron a ningún evento privado todavía."
            ) : (
              <>
                <p className="mb-1">Todavía no creaste ningún evento.</p>
                <Link href="/create" className="text-xs text-blue-600 hover:underline">
                  Creá tu primer evento →
                </Link>
              </>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((ev) => {
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
                    <Link href={`/u/${ev.creator.username}/e/${ev.id}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ev.image_url}
                        alt={ev.title}
                        className="w-full h-48 object-cover"
                      />
                    </Link>
                  )}
                  <div className="flex items-start gap-3 p-4">
                    <Link href={`/u/${ev.creator.username}`}>
                      <Avatar src={ev.creator.avatar_url} name={ev.creator.full_name} size="md" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <Link
                            href={`/u/${ev.creator.username}`}
                            className="font-medium text-zinc-900 hover:underline truncate"
                          >
                            {ev.creator.full_name ?? ev.creator.username}
                          </Link>
                          <span className="text-xs text-zinc-400 shrink-0">@{ev.creator.username}</span>
                        </div>
                        {/* Follow button on Privados cards for creators you don't follow yet */}
                        {filter === "private" && !isFollowingCreator && (
                          <button
                            onClick={() => quickFollow(ev.creator_id)}
                            disabled={followBusy === ev.creator_id}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                          >
                            <UserPlus className="h-3 w-3" />
                            Seguir
                          </button>
                        )}
                        {/* RSVP count badge on Míos cards */}
                        {filter === "mine" && acceptedCount > 0 && (
                          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <Check className="h-3 w-3" />
                            {acceptedCount} {acceptedCount === 1 ? "confirmó" : "confirmaron"}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/u/${ev.creator.username}/e/${ev.id}`}
                        className="block hover:underline"
                      >
                        <h3 className="font-medium text-zinc-900 mt-1.5">{ev.title}</h3>
                      </Link>
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(ev.start_at)}
                      </p>
                      {ev.location && (
                        <p className="text-xs text-zinc-500 mt-0.5">📍 {ev.location}</p>
                      )}
                      {ev.description && (
                        <p className="text-sm text-zinc-700 mt-2 whitespace-pre-line line-clamp-3">
                          {ev.description}
                        </p>
                      )}
                      {/* RSVP buttons for private events I'm invited to */}
                      {filter === "private" && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => rsvp(ev.id, "accepted")}
                            disabled={rsvpBusy === ev.id}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-60 ${
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
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-60 ${
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
      </main>

      <Toast state={toast.state} />
    </div>
  );
}
