"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Globe, Lock, UserPlus, UserMinus, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { SearchBar } from "@/components/SearchBar";
import { Toast, useToast } from "@/components/Toast";
import type { Profile, SentEvent } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params?.username;
  const { user, loading: userLoading, signOut } = useUser();
  const toast = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<SentEvent[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [eventFilter, setEventFilter] = useState<"public" | "private">("public");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!username || !user) return;
    const supabase = createClient();
    (async () => {
      setLoading(true);
      setNotFound(false);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (!prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(prof as Profile);

      const isOwn = prof.id === user.id;
      const eventsQuery = supabase
        .from("sent_events")
        .select("*")
        .eq("creator_id", prof.id)
        .order("start_at", { ascending: false });
      if (!isOwn) eventsQuery.eq("visibility", "public");

      const [{ data: evs }, { count: followers }, { count: following }, { data: myFollow }] =
        await Promise.all([
          eventsQuery,
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", prof.id),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", prof.id),
          supabase
            .from("follows")
            .select("*")
            .eq("follower_id", user.id)
            .eq("following_id", prof.id)
            .maybeSingle(),
        ]);

      setEvents((evs ?? []) as SentEvent[]);
      setFollowerCount(followers ?? 0);
      setFollowingCount(following ?? 0);
      setIsFollowing(Boolean(myFollow));
      setLoading(false);
    })();
  }, [username, user]);

  async function toggleFollow() {
    if (!profile || !user || followBusy) return;
    setFollowBusy(true);
    const supabase = createClient();
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.id);
        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: profile.id });
        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } catch (err) {
      console.error(err);
      toast.show("error", "No se pudo actualizar.");
    } finally {
      setFollowBusy(false);
    }
  }

  if (userLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Cargando…</div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
        <NavBar
          username={user.profile.username}
          fullName={user.profile.full_name}
          avatarUrl={user.profile.avatar_url}
          onSignOut={signOut}
        />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-zinc-500">No existe un usuario con ese nombre.</p>
        </main>
      </div>
    );
  }

  const isMe = user.id === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <NavBar
        username={user.profile.username}
        fullName={user.profile.full_name}
        avatarUrl={user.profile.avatar_url}
        onSignOut={signOut}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-zinc-900 truncate">
                    {profile.full_name ?? profile.username}
                  </h1>
                  <p className="text-sm text-zinc-500 truncate">@{profile.username}</p>
                </div>
                {isMe ? (
                  <Link
                    href="/profile"
                    className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-full text-xs sm:text-sm font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
                  >
                    Editar
                    <span className="hidden sm:inline">perfil</span>
                  </Link>
                ) : (
                  <button
                    onClick={toggleFollow}
                    disabled={followBusy}
                    className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-full text-xs sm:text-sm font-semibold transition disabled:opacity-60 ${
                      isFollowing
                        ? "bg-zinc-100 text-zinc-700 hover:bg-red-50 hover:text-red-600"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isFollowing ? "Siguiendo" : "Seguir"}
                  </button>
                )}
              </div>
              {profile.description && (
                <p className="text-sm text-zinc-700 mt-2 whitespace-pre-line">{profile.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span>
                  <strong>{followerCount}</strong>{" "}
                  <span className="text-zinc-500">seguidores</span>
                </span>
                <span>
                  <strong>{followingCount}</strong>{" "}
                  <span className="text-zinc-500">siguiendo</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Buscar eventos…"
            />
          </div>
          {isMe ? (
            <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1 mb-3">
              <button
                onClick={() => setEventFilter("public")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  eventFilter === "public"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Globe className="h-4 w-4" /> Públicos (
                {events.filter((e) => e.visibility === "public").length})
              </button>
              <button
                onClick={() => setEventFilter("private")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  eventFilter === "private"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Lock className="h-4 w-4" /> Privados (
                {events.filter((e) => e.visibility === "private").length})
              </button>
            </div>
          ) : (
            <h2 className="text-base font-semibold text-zinc-900 mb-3 flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> Eventos públicos
            </h2>
          )}

          {(() => {
            const visibilityFiltered = isMe
              ? events.filter((e) => e.visibility === eventFilter)
              : events;
            const q = query.trim().toLowerCase();
            const filtered = q
              ? visibilityFiltered.filter(
                  (e) =>
                    e.title.toLowerCase().includes(q) ||
                    (e.description ?? "").toLowerCase().includes(q) ||
                    (e.location ?? "").toLowerCase().includes(q)
                )
              : visibilityFiltered;
            if (filtered.length === 0) {
              return (
                <div className="text-sm text-zinc-500 text-center py-8 bg-white rounded-2xl border border-zinc-200">
                  {isMe
                    ? eventFilter === "public"
                      ? "Todavía no publicaste eventos."
                      : "Todavía no creaste eventos privados."
                    : "Sin eventos públicos por ahora."}
                </div>
              );
            }
            return (
              <ul className="space-y-2">
                {filtered.map((ev) => (
                  <li
                    key={ev.id}
                    className="bg-white rounded-xl border border-zinc-200 overflow-hidden"
                  >
                    {ev.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ev.image_url}
                        alt={ev.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-zinc-900">{ev.title}</h3>
                        {isMe &&
                          (ev.visibility === "public" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                              <Globe className="h-3 w-3" /> Público
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                              <Lock className="h-3 w-3" /> Privado
                            </span>
                          ))}
                      </div>
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
                  </li>
                ))}
              </ul>
            );
          })()}
        </section>
      </main>

      <Toast state={toast.state} />
    </div>
  );
}
