"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Share2, UserCheck, UserMinus, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { SearchBar } from "@/components/SearchBar";
import { Toast, useToast } from "@/components/Toast";
import type { Profile } from "@/lib/types";

type Tab = "contacts" | "following";

export default function ContactsPage() {
  const { user, loading: userLoading, signOut } = useUser();
  const toast = useToast();

  const [tab, setTab] = useState<Tab>("contacts");
  const [following, setFollowing] = useState<Profile[]>([]);
  const [mutuals, setMutuals] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Contact requests I've sent (pending)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      setLoading(true);
      const [{ data: followingRows }, { data: followerRows }, { data: requestRows }] =
        await Promise.all([
          supabase.from("follows").select("following_id").eq("follower_id", user.id),
          supabase.from("follows").select("follower_id").eq("following_id", user.id),
          supabase
            .from("contact_requests")
            .select("to_id")
            .eq("from_id", user.id)
            .eq("status", "pending"),
        ]);

      const followingProfileIds = (followingRows ?? []).map((r) => r.following_id);
      const followerProfileIds = new Set((followerRows ?? []).map((r) => r.follower_id));
      const mutualIds = followingProfileIds.filter((id) => followerProfileIds.has(id));

      setPendingIds(new Set((requestRows ?? []).map((r) => r.to_id)));

      const allIds = Array.from(new Set([...followingProfileIds]));
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

  // Global search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = query.trim();
    if (!q || !user) { setSearchResults(null); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .neq("id", user.id)
        .limit(30);
      setSearchResults((data as Profile[]) ?? []);
      setSearching(false);
    }, 300);
  }, [query, user]);

  async function handleInvite() {
    if (!user) return;
    const url = `${window.location.origin}/login?ref=${user.profile.username ?? ""}`;
    const text = `¡Sumate a Agenddi conmigo! ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Agenddi", text, url }); return; } catch { /* cancelled */ }
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

  async function sendRequest(target: Profile) {
    if (!user || busyId) return;
    setBusyId(target.id);
    const supabase = createClient();
    try {
      // Insert contact request
      const { error: reqErr } = await supabase.from("contact_requests").insert({
        from_id: user.id,
        to_id: target.id,
        status: "pending",
      });
      if (reqErr) throw reqErr;

      // Create notification for the target
      await supabase.from("notifications").insert({
        user_id: target.id,
        type: "contact_request",
        data: {
          from_id: user.id,
          from_name: user.profile.full_name ?? user.profile.username ?? "Alguien",
          from_username: user.profile.username,
          from_avatar: user.profile.avatar_url,
        },
      });

      setPendingIds((prev) => new Set(prev).add(target.id));
      toast.show("success", `Solicitud enviada a ${target.full_name ?? target.username}.`);
    } catch {
      toast.show("error", "No se pudo enviar la solicitud.");
    } finally {
      setBusyId(null);
    }
  }

  async function unfollow(target: Profile) {
    if (!user || busyId) return;
    setBusyId(target.id);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", target.id);
      if (error) throw error;
      setFollowingIds((prev) => { const n = new Set(prev); n.delete(target.id); return n; });
      setFollowing((prev) => prev.filter((p) => p.id !== target.id));
      setMutuals((prev) => prev.filter((p) => p.id !== target.id));
    } catch {
      toast.show("error", "No se pudo dejar de seguir.");
    } finally {
      setBusyId(null);
    }
  }

  const tabList = useMemo(() => {
    const base = tab === "contacts" ? mutuals : following;
    const q = query.trim().toLowerCase();
    if (!q || searchResults !== null) return base;
    return base.filter(
      (p) =>
        (p.username ?? "").toLowerCase().includes(q) ||
        (p.full_name ?? "").toLowerCase().includes(q)
    );
  }, [tab, mutuals, following, query, searchResults]);

  if (userLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-zinc-500 text-sm">Cargando…</div></div>;
  }

  const isSearchMode = searchResults !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br bg-stone-50">
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
            className="shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-full bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition"
          >
            {inviteCopied ? (
              <><Check className="h-3.5 w-3.5" /> Copiado</>
            ) : (
              <><Share2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Invitar a Agenddi</span><span className="sm:hidden">Invitar</span></>
            )}
          </button>
        </div>

        <SearchBar value={query} onChange={setQuery} placeholder="Buscar usuarios en Agenddi…" />

        {!isSearchMode && (
          <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1">
            <button
              onClick={() => setTab("contacts")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${tab === "contacts" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
            >
              Contactos ({mutuals.length})
            </button>
            <button
              onClick={() => setTab("following")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${tab === "following" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
            >
              Seguidos ({following.length})
            </button>
          </div>
        )}

        {isSearchMode ? (
          searching ? (
            <div className="text-sm text-zinc-500 text-center py-8">Buscando…</div>
          ) : searchResults.length === 0 ? (
            <div className="text-sm text-zinc-500 text-center py-12 bg-white rounded-2xl border border-zinc-200">No se encontraron usuarios.</div>
          ) : (
            <ul className="space-y-2">
              {searchResults.map((p) => (
                <UserRow
                  key={p.id}
                  profile={p}
                  isMutual={followingIds.has(p.id)}
                  isPending={pendingIds.has(p.id)}
                  busy={busyId === p.id}
                  onAdd={() => sendRequest(p)}
                  onUnfollow={() => unfollow(p)}
                />
              ))}
            </ul>
          )
        ) : loading ? (
          <div className="text-sm text-zinc-500 text-center py-8">Cargando…</div>
        ) : tabList.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-12 bg-white rounded-2xl border border-zinc-200">
            {tab === "contacts" ? "Todavía no tenés contactos." : "Todavía no seguís a nadie."}
          </div>
        ) : (
          <ul className="space-y-2">
            {tabList.map((p) => (
              <UserRow
                key={p.id}
                profile={p}
                isMutual={followingIds.has(p.id)}
                isPending={pendingIds.has(p.id)}
                busy={busyId === p.id}
                onAdd={() => sendRequest(p)}
                onUnfollow={() => unfollow(p)}
              />
            ))}
          </ul>
        )}
      </main>

      <Toast state={toast.state} />
    </div>
  );
}

function UserRow({
  profile: p,
  isMutual,
  isPending,
  busy,
  onAdd,
  onUnfollow,
}: {
  profile: Profile;
  isMutual: boolean;
  isPending: boolean;
  busy: boolean;
  onAdd: () => void;
  onUnfollow: () => void;
}) {
  return (
    <li className="bg-white rounded-xl border border-zinc-200 p-3 flex items-center gap-3">
      <Link href={`/u/${p.username}`}>
        <Avatar src={p.avatar_url} name={p.full_name} size="md" />
      </Link>
      <Link href={`/u/${p.username}`} className="flex-1 min-w-0 hover:underline">
        <div className="font-medium text-zinc-900 truncate">{p.full_name ?? p.username}</div>
        <div className="text-xs text-zinc-500 truncate">@{p.username}</div>
      </Link>

      {isMutual ? (
        <button
          onClick={onUnfollow}
          disabled={busy}
          className="flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-60"
        >
          <UserCheck className="h-3.5 w-3.5" /> Contacto
        </button>
      ) : isPending ? (
        <span className="flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 cursor-default">
          <UserMinus className="h-3.5 w-3.5" /> Enviada
        </span>
      ) : (
        <button
          onClick={onAdd}
          disabled={busy}
          className="flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 transition disabled:opacity-60"
        >
          <UserPlus className="h-3.5 w-3.5" /> Añadir
        </button>
      )}
    </li>
  );
}
