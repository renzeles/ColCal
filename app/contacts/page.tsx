"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Share2, UserCheck, UserMinus, UserPlus } from "lucide-react";
import { useT } from "@/lib/i18n";
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
  const { t } = useT();

  const [tab, setTab] = useState<Tab>("contacts");
  const [following, setFollowing] = useState<Profile[]>([]);
  const [mutuals, setMutuals] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Contact requests I've sent (pending)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);

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

      // Load suggestions: profiles that aren't me, aren't already followed, no pending request
      const exclude = new Set([
        user.id,
        ...followingProfileIds,
        ...((requestRows ?? []).map((r) => r.to_id)),
      ]);
      const { data: suggestData } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .not("username", "is", null)
        .limit(20);
      const filtered = ((suggestData as Profile[]) ?? []).filter((p) => !exclude.has(p.id)).slice(0, 12);
      setSuggestions(filtered);

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
      setSuggestions((prev) => prev.filter((p) => p.id !== target.id));
      toast.show("success", `Solicitud enviada a ${target.full_name ?? target.username}.`);
    } catch {
      toast.show("error", "No se pudo enviar la solicitud.");
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
    <div className="min-h-screen bg-gradient-to-br bakery-bg">
      <NavBar
        username={user.profile.username}
        fullName={user.profile.full_name}
        avatarUrl={user.profile.avatar_url}
        onSignOut={signOut}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-3xl font-bold text-stone-900" >{t("contacts_title")}</h1>
          <button
            onClick={handleInvite}
            className="shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-full bg-[#8b5a3c] text-white text-xs font-semibold hover:bg-[#6b4423] transition"
          >
            {inviteCopied ? (
              <><Check className="h-3.5 w-3.5" /> {t("contacts_copied")}</>
            ) : (
              <><Share2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t("contacts_invite")}</span><span className="sm:hidden">{t("contacts_invite_short")}</span></>
            )}
          </button>
        </div>

        <SearchBar value={query} onChange={setQuery} placeholder={t("contacts_search")} />

        {/* Suggestions — horizontal scroll, no title */}
        {!isSearchMode && suggestions.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
            {suggestions.map((p) => (
              <SuggestionCard
                key={p.id}
                profile={p}
                busy={busyId === p.id}
                pending={pendingIds.has(p.id)}
                onAdd={() => sendRequest(p)}
              />
            ))}
          </div>
        )}

        {!isSearchMode && (
          <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1">
            <button
              onClick={() => setTab("contacts")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${tab === "contacts" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
            >
              {t("contacts_tab_contacts")} ({mutuals.length})
            </button>
            <button
              onClick={() => setTab("following")}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${tab === "following" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
            >
              {t("contacts_tab_following")} ({following.length})
            </button>
          </div>
        )}

        {isSearchMode ? (
          searching ? (
            <div className="text-sm text-stone-500 text-center py-8">{t("contacts_searching")}</div>
          ) : searchResults.length === 0 ? (
            <div className="text-sm text-stone-500 text-center py-12 bg-white rounded-2xl card-shadow">{t("contacts_no_results")}</div>
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
                  onUnfollow={() => {}}
                />
              ))}
            </ul>
          )
        ) : loading ? (
          <div className="text-sm text-stone-500 text-center py-8">{t("page_loading")}</div>
        ) : tabList.length === 0 ? (
          <div className="text-sm text-stone-500 text-center py-12 bg-white rounded-2xl card-shadow">
            {tab === "contacts" ? t("contacts_empty_contacts") : t("contacts_empty_following")}
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
                onUnfollow={() => {}}
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
}: {
  profile: Profile;
  isMutual: boolean;
  isPending: boolean;
  busy: boolean;
  onAdd: () => void;
  onUnfollow: () => void;
}) {
  const { t } = useT();
  return (
    <li className="bg-white rounded-xl card-shadow p-3 flex items-center gap-3">
      <Link href={`/u/${p.username}`}>
        <Avatar src={p.avatar_url} name={p.full_name} size="md" />
      </Link>
      <Link href={`/u/${p.username}`} className="flex-1 min-w-0 hover:underline">
        <div className="font-medium text-stone-900 truncate">{p.full_name ?? p.username}</div>
        <div className="text-xs text-stone-500 truncate">@{p.username}</div>
      </Link>

      {isMutual ? (
        <span className="flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default">
          <UserCheck className="h-3.5 w-3.5" /> {t("contacts_contact")}
        </span>
      ) : isPending ? (
        <span className="flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-stone-100 text-stone-500 cursor-default">
          <UserMinus className="h-3.5 w-3.5" /> {t("contacts_pending")}
        </span>
      ) : (
        <button
          onClick={onAdd}
          disabled={busy}
          className="flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-stone-900 text-[#faf6ef] hover:bg-stone-700 transition disabled:opacity-60 cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" /> {t("contacts_add")}
        </button>
      )}
    </li>
  );
}

function SuggestionCard({
  profile: p,
  busy,
  pending,
  onAdd,
}: {
  profile: Profile;
  busy: boolean;
  pending: boolean;
  onAdd: () => void;
}) {
  const { t } = useT();
  return (
    <div className="snap-start shrink-0 w-32 bg-white rounded-2xl card-shadow p-3 flex flex-col items-center text-center">
      <Link href={`/u/${p.username}`} className="mb-2">
        <Avatar src={p.avatar_url} name={p.full_name} size="lg" />
      </Link>
      <Link href={`/u/${p.username}`} className="text-xs font-semibold text-stone-900 truncate w-full hover:underline">
        {p.full_name ?? p.username}
      </Link>
      <p className="text-[10px] text-stone-500 truncate w-full">@{p.username}</p>
      {pending ? (
        <span className="mt-2 w-full text-center text-[10px] font-semibold text-stone-500 px-2 py-1.5 rounded-full bg-stone-100">
          {t("contacts_pending")}
        </span>
      ) : (
        <button
          onClick={onAdd}
          disabled={busy}
          className="mt-2 w-full text-[11px] font-semibold text-[#faf6ef] bg-stone-900 hover:bg-stone-700 px-2 py-1.5 rounded-full transition cursor-pointer disabled:opacity-60"
        >
          + {t("contacts_add")}
        </button>
      )}
    </div>
  );
}
