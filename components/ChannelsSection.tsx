"use client";

import { useEffect, useRef, useState } from "react";
import { Hash, Plus, RotateCcw, Search, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";

type Channel = {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  created_by: string;
  created_at: string;
};

const EMOJI_PALETTE = ["🥐", "🍞", "🥖", "🧁", "☕", "🥧", "🍩", "🥨", "🎂", "🌾"];

export function ChannelsSection({ userId }: { userId: string }) {
  const { t } = useT();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [myMemberSet, setMyMemberSet] = useState<Set<string>>(new Set());
  const [memberCounts, setMemberCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Channel[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🥐");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: members } = await supabase
        .from("channel_members")
        .select("channel_id")
        .eq("user_id", userId);
      const channelIds = (members ?? []).map((m) => m.channel_id);
      setMyMemberSet(new Set(channelIds));

      if (channelIds.length === 0) {
        setChannels([]);
        setLoading(false);
        return;
      }

      const { data: ch } = await supabase
        .from("channels")
        .select("*")
        .in("id", channelIds)
        .order("created_at", { ascending: false });
      setChannels((ch as Channel[]) ?? []);

      const { data: allMembers } = await supabase
        .from("channel_members")
        .select("channel_id")
        .in("channel_id", channelIds);
      const counts = new Map<string, number>();
      ((allMembers ?? []) as { channel_id: string }[]).forEach((m) => {
        counts.set(m.channel_id, (counts.get(m.channel_id) ?? 0) + 1);
      });
      setMemberCounts(counts);
      setLoading(false);
    })();
  }, [userId]);

  // Debounced channel search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = query.trim();
    if (!q) { setSearchResults(null); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("channels")
        .select("*")
        .ilike("name", `%${q}%`)
        .limit(30);
      setSearchResults((data as Channel[]) ?? []);
      setSearching(false);
    }, 300);
  }, [query]);

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    const supabase = createClient();
    try {
      const { data: ch, error } = await supabase
        .from("channels")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          emoji,
          created_by: userId,
        })
        .select("*")
        .single();
      if (error || !ch) throw error;

      await supabase.from("channel_members").insert({
        channel_id: ch.id,
        user_id: userId,
        role: "admin",
      });

      setChannels((prev) => [ch as Channel, ...prev]);
      setMyMemberSet((prev) => new Set(prev).add(ch.id));
      setMemberCounts((prev) => new Map(prev).set(ch.id, 1));
      setName("");
      setDescription("");
      setEmoji("🥐");
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function joinChannel(ch: Channel) {
    if (joining) return;
    setJoining(ch.id);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("channel_members")
        .insert({ channel_id: ch.id, user_id: userId, role: "member" });
      if (error) throw error;

      setMyMemberSet((prev) => new Set(prev).add(ch.id));
      setChannels((prev) => prev.find((c) => c.id === ch.id) ? prev : [ch, ...prev]);
      setMemberCounts((prev) => {
        const next = new Map(prev);
        next.set(ch.id, (next.get(ch.id) ?? 0) + 1);
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(null);
    }
  }

  if (loading) return <div className="text-sm text-stone-500 text-center py-8">{t("page_loading")}</div>;

  const isSearching = query.trim().length > 0;

  function ChannelCard({ ch, mode }: { ch: Channel; mode: "mine" | "search" }) {
    const joined = myMemberSet.has(ch.id);
    return (
      <li className="bg-white rounded-2xl card-shadow card-shadow-hover p-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-xl bg-[#fbf6ee] flex items-center justify-center text-2xl shrink-0">
            {ch.emoji ?? "🥐"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-stone-400" />
              <h3 className="font-extrabold text-stone-900 truncate">{ch.name}</h3>
            </div>
            {ch.description && (
              <p className="text-sm text-stone-600 mt-0.5 line-clamp-2">{ch.description}</p>
            )}
            <p className="text-xs text-stone-400 mt-1.5 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {memberCounts.get(ch.id) ?? (joined ? 1 : 0)} {(memberCounts.get(ch.id) ?? 0) === 1 ? "member" : "members"}
            </p>
          </div>
          {mode === "search" && (
            joined ? (
              <span className="shrink-0 self-start flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-[#fbf6ee] text-[#8b5a3c] border border-[#8b5a3c]/20 cursor-default">
                {t("joined")}
              </span>
            ) : (
              <button
                onClick={() => joinChannel(ch)}
                disabled={joining === ch.id}
                className="shrink-0 self-start flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-stone-900 text-[#faf6ef] hover:bg-[#8b5a3c] transition disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" /> {t("join")}
              </button>
            )
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#8b5a3c]" strokeWidth={2.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("channels_search")}
            className="w-full rounded-2xl bg-stone-50 border border-stone-200 text-[15px] text-stone-900 font-medium focus:outline-none focus:border-[#8b5a3c] focus:bg-white focus:ring-4 focus:ring-[#8b5a3c]/8 transition-all placeholder:text-stone-400 placeholder:font-normal"
            style={{ paddingLeft: "3.25rem", paddingRight: "1rem", height: "3.25rem" }}
          />
        </div>
        <button
          type="button"
          onClick={() => setQuery("")}
          disabled={!query}
          style={{ height: "3.25rem", width: "3.25rem" }}
          className={`shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all btn-modern ${
            query
              ? "bg-[#fbf6ee] border-[#8b5a3c]/30 text-[#8b5a3c] hover:bg-white hover:border-[#8b5a3c] hover:rotate-[-90deg]"
              : "bg-stone-50 border-stone-200 text-stone-300 opacity-60 cursor-not-allowed"
          }`}
          aria-label={t("ne_clear")}
        >
          <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Search mode */}
      {isSearching ? (
        searching ? (
          <div className="text-sm text-stone-500 text-center py-8">{t("contacts_searching")}</div>
        ) : (searchResults?.length ?? 0) === 0 ? (
          <div className="text-sm text-stone-500 text-center py-12 bg-white rounded-2xl card-shadow">
            {t("channels_search_empty")}
          </div>
        ) : (
          <ul className="space-y-2">
            {(searchResults ?? []).map((ch) => <ChannelCard key={ch.id} ch={ch} mode="search" />)}
          </ul>
        )
      ) : (
        <>
          {/* Create button */}
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border-2 border-dashed border-[#8b5a3c]/30 text-[#8b5a3c] font-semibold text-sm hover:bg-[#fbf6ee] hover:border-[#8b5a3c]/50 transition"
          >
            <Plus className="h-4 w-4" /> {t("channels_create")}
          </button>

          {/* My channels list */}
          {channels.length === 0 ? (
            <div className="text-sm text-stone-500 text-center py-12 bg-white rounded-2xl card-shadow">
              {t("channels_empty")}
            </div>
          ) : (
            <ul className="space-y-2">
              {channels.map((ch) => <ChannelCard key={ch.id} ch={ch} mode="mine" />)}
            </ul>
          )}
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-[#f5efe2] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
                {t("channels_create")}
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="h-8 w-8 rounded-full bg-stone-200/50 hover:bg-stone-200 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-stone-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">Emoji</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_PALETTE.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`h-10 w-10 rounded-xl text-xl flex items-center justify-center transition ${
                        emoji === e
                          ? "bg-[#8b5a3c] ring-2 ring-[#8b5a3c]"
                          : "bg-white hover:bg-[#fbf6ee]"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
                  {t("channel_name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asado de los viernes"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#8b5a3c] text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
                  {t("channel_desc")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this channel about?"
                  rows={2}
                  maxLength={140}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-[#8b5a3c] text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className="flex-1 py-3 rounded-xl bg-[#8b5a3c] text-white font-semibold text-sm hover:bg-[#6b4423] transition disabled:opacity-50"
                >
                  {creating ? "..." : t("channel_create_btn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
