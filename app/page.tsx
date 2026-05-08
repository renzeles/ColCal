"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Globe, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { SearchBar } from "@/components/SearchBar";
import { Toast, useToast } from "@/components/Toast";
import type { Profile, SentEvent } from "@/lib/types";

type FeedItem = SentEvent & { creator: Profile };
type Filter = "public" | "private";

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
  const { user, loading: userLoading, signOut } = useUser();
  const toast = useToast();
  const [publicItems, setPublicItems] = useState<FeedItem[]>([]);
  const [privateItems, setPrivateItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);
  const [filter, setFilter] = useState<Filter>("public");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      setLoading(true);

      // Public events from people I follow
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followedIds = (follows ?? []).map((f) => f.following_id);
      setFollowingCount(followedIds.length);

      // Private events I'm invited to
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

      const [publicRes, privateRes] = await Promise.all([
        publicQuery ?? Promise.resolve({ data: [] as SentEvent[] }),
        privateQuery ?? Promise.resolve({ data: [] as SentEvent[] }),
      ]);

      const allCreatorIds = Array.from(
        new Set([
          ...((publicRes.data ?? []) as SentEvent[]).map((e) => e.creator_id),
          ...((privateRes.data ?? []) as SentEvent[]).map((e) => e.creator_id),
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

      setPublicItems(withCreator((publicRes.data ?? []) as SentEvent[]));
      setPrivateItems(withCreator((privateRes.data ?? []) as SentEvent[]));
      setLoading(false);
    })();
  }, [user]);

  const items = useMemo(() => {
    const base = filter === "public" ? publicItems : privateItems;
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
  }, [filter, publicItems, privateItems, query]);

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Cargando…</div>
      </div>
    );
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

        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar eventos…"
        />

        <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1">
          <button
            onClick={() => setFilter("public")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              filter === "public" ? "bg-violet-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Globe className="h-4 w-4" /> Públicos ({publicItems.length})
          </button>
          <button
            onClick={() => setFilter("private")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              filter === "private" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Lock className="h-4 w-4" /> Privados ({privateItems.length})
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-zinc-500 text-center py-8">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-12 bg-white rounded-2xl border border-zinc-200">
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
            ) : (
              "No te invitaron a ningún evento privado todavía."
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((ev) => (
              <li key={ev.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                {ev.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.image_url}
                    alt={ev.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="flex items-start gap-3 p-4">
                  <Link href={`/u/${ev.creator.username}`}>
                    <Avatar src={ev.creator.avatar_url} name={ev.creator.full_name} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <Link
                        href={`/u/${ev.creator.username}`}
                        className="font-medium text-zinc-900 hover:underline truncate"
                      >
                        {ev.creator.full_name ?? ev.creator.username}
                      </Link>
                      <span className="text-xs text-zinc-400">@{ev.creator.username}</span>
                    </div>
                    <h3 className="font-medium text-zinc-900 mt-1.5">{ev.title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(ev.start_at)}
                    </p>
                    {ev.location && <p className="text-xs text-zinc-500 mt-0.5">📍 {ev.location}</p>}
                    {ev.description && (
                      <p className="text-sm text-zinc-700 mt-2 whitespace-pre-line">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Toast state={toast.state} />
    </div>
  );
}
