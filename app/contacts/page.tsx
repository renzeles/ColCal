"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserPlus, UserMinus, Share2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { SearchBar } from "@/components/SearchBar";
import { Toast, useToast } from "@/components/Toast";
import type { Profile } from "@/lib/types";

type Tab = "mutuals" | "following";

export default function ContactsPage() {
  const { user, loading: userLoading, signOut } = useUser();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("mutuals");
  const [following, setFollowing] = useState<Profile[]>([]);
  const [mutuals, setMutuals] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
        supabase.from("follows").select("follower_id").eq("following_id", user.id),
      ]);

      const followingProfileIds = (followingRows ?? []).map((r) => r.following_id);
      const followerProfileIds = new Set((followerRows ?? []).map((r) => r.follower_id));
      const mutualIds = followingProfileIds.filter((id) => followerProfileIds.has(id));

      const allIds = Array.from(new Set([...followingProfileIds, ...mutualIds]));
      const profiles =
        allIds.length === 0
          ? []
          : (await supabase.from("profiles").select("*").in("id", allIds)).data ?? [];

      const profileMap = new Map<string, Profile>();
      (profiles as Profile[]).forEach((p) => profileMap.set(p.id, p));

      setFollowing(
        followingProfileIds.map((id) => profileMap.get(id)).filter((p): p is Profile => Boolean(p))
      );
      setMutuals(mutualIds.map((id) => profileMap.get(id)).filter((p): p is Profile => Boolean(p)));
      setFollowingIds(new Set(followingProfileIds));
      setLoading(false);
    })();
  }, [user]);

  async function handleInvite() {
    if (!user) return;
    const url = `${window.location.origin}/login?ref=${user.profile.username ?? ""}`;
    const text = `¡Sumate a Agenddi conmigo! ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Agenddi", text, url });
        return;
      } catch {
        // user cancelled or unsupported, fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
      toast.show("success", "Link copiado al portapapeles");
    } catch {
      toast.show("error", "No se pudo copiar el link");
    }
  }

  async function toggleFollow(target: Profile) {
    if (!user || busyId) return;
    setBusyId(target.id);
    const supabase = createClient();
    try {
      if (followingIds.has(target.id)) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", target.id);
        if (error) throw error;
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(target.id);
          return next;
        });
        setFollowing((prev) => prev.filter((p) => p.id !== target.id));
        setMutuals((prev) => prev.filter((p) => p.id !== target.id));
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: target.id });
        if (error) throw error;
        setFollowingIds((prev) => new Set(prev).add(target.id));
        setFollowing((prev) => (prev.find((p) => p.id === target.id) ? prev : [target, ...prev]));
      }
    } catch (err) {
      console.error(err);
      toast.show("error", "No se pudo actualizar.");
    } finally {
      setBusyId(null);
    }
  }

  const list = useMemo(() => {
    const base = tab === "mutuals" ? mutuals : following;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (p) =>
        (p.username ?? "").toLowerCase().includes(q) ||
        (p.full_name ?? "").toLowerCase().includes(q)
    );
  }, [tab, mutuals, following, query]);

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
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-zinc-900">Contactos</h1>
          <button
            onClick={handleInvite}
            className="shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-full bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition"
          >
            {inviteCopied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copiado
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Invitar a Agenddi</span>
                <span className="sm:hidden">Invitar</span>
              </>
            )}
          </button>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nombre o usuario…"
        />

        <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1">
          <button
            onClick={() => setTab("mutuals")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
              tab === "mutuals" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Contactos ({mutuals.length})
          </button>
          <button
            onClick={() => setTab("following")}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
              tab === "following" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Seguidos ({following.length})
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-zinc-500 text-center py-8">Cargando…</div>
        ) : list.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-12 bg-white rounded-2xl border border-zinc-200">
            {query.trim()
              ? "Sin resultados."
              : tab === "mutuals"
              ? "Todavía no tenés contactos en común."
              : "Todavía no seguís a nadie."}
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((p) => {
              const iFollow = followingIds.has(p.id);
              return (
                <li
                  key={p.id}
                  className="bg-white rounded-xl border border-zinc-200 p-3 flex items-center gap-3"
                >
                  <Link href={`/u/${p.username}`}>
                    <Avatar src={p.avatar_url} name={p.full_name} size="md" />
                  </Link>
                  <Link href={`/u/${p.username}`} className="flex-1 min-w-0 hover:underline">
                    <div className="font-medium text-zinc-900 truncate">
                      {p.full_name ?? p.username}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">@{p.username}</div>
                  </Link>
                  <button
                    onClick={() => toggleFollow(p)}
                    disabled={busyId === p.id}
                    className={`flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold transition disabled:opacity-60 ${
                      iFollow
                        ? "bg-zinc-100 text-zinc-700 hover:bg-red-50 hover:text-red-600"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {iFollow ? (
                      <UserMinus className="h-3.5 w-3.5" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    {iFollow ? "Siguiendo" : "Seguir"}
                  </button>
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
