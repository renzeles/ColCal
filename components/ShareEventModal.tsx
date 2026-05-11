"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Search, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import { Avatar } from "./Avatar";
import type { Profile } from "@/lib/types";

type ShareEvent = {
  id: string;
  title: string;
  start_at: string;
  creator: { username: string | null };
};

type Props = {
  event: ShareEvent;
  userId: string;
  userProfile: Profile;
  onClose: () => void;
  onSuccess: (count: number) => void;
};

export function ShareEventModal({ event, userId, userProfile, onClose, onSuccess }: Props) {
  const { t } = useT();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Load mutual contacts
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", userId),
        supabase.from("follows").select("follower_id").eq("following_id", userId),
      ]);
      const followingIds = (followingRows ?? []).map((r) => r.following_id);
      const followerIds = new Set((followerRows ?? []).map((r) => r.follower_id));
      const mutualIds = followingIds.filter((id) => followerIds.has(id));
      if (mutualIds.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("*").in("id", mutualIds);
      setContacts(((data as Profile[]) ?? []).sort((a, b) =>
        (a.full_name ?? a.username ?? "").localeCompare(b.full_name ?? b.username ?? "")
      ));
      setLoading(false);
    })();
  }, [userId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (selected.size === 0 || sending) return;
    setSending(true);
    try {
      const supabase = createClient();
      const eventUrl = event.creator.username
        ? `/u/${event.creator.username}/e/${event.id}`
        : `/event/${event.id}`;
      const notifs = Array.from(selected).map((toId) => ({
        user_id: toId,
        type: "event_share",
        data: {
          event_id: event.id,
          event_title: event.title,
          event_url: eventUrl,
          event_start: event.start_at,
          shared_by_id: userId,
          shared_by_name: userProfile.full_name ?? userProfile.username ?? "Someone",
          shared_by_username: userProfile.username,
          shared_by_avatar: userProfile.avatar_url,
        },
      }));
      await supabase.from("notifications").insert(notifs);
      onSuccess(selected.size);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function handleCopyLink() {
    const url = event.creator.username
      ? `${window.location.origin}/u/${event.creator.username}/e/${event.id}`
      : `${window.location.origin}/event/${event.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch { /* */ }
  }

  const filtered = contacts.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.full_name ?? "").toLowerCase().includes(q) ||
      (c.username ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-[#f5efe2] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{t("share")}</p>
            <h3 className="text-xl font-extrabold text-stone-900 tracking-tight truncate">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="ml-3 shrink-0 h-9 w-9 rounded-full bg-stone-200/60 hover:bg-stone-200 flex items-center justify-center"
          >
            <X className="h-4 w-4 text-stone-600" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b5a3c]" strokeWidth={2.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("share_search")}
              className="w-full pl-11 pr-3 h-11 rounded-2xl bg-white border border-stone-200 text-sm focus:outline-none focus:border-[#8b5a3c] focus:ring-4 focus:ring-[#8b5a3c]/10 transition"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-[180px]">
          {loading ? (
            <div className="text-sm text-stone-400 text-center py-10">{t("page_loading")}</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-10 px-6">
              <div className="text-3xl mb-2">🥐</div>
              <p className="text-sm text-stone-500">{t("share_no_contacts")}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-stone-400 text-center py-10">—</div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((c) => {
                const checked = selected.has(c.id);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => toggle(c.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl transition ${
                        checked ? "bg-white shadow-sm" : "hover:bg-white/60"
                      }`}
                    >
                      <Avatar src={c.avatar_url} name={c.full_name} size="md" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-semibold text-stone-900 truncate text-sm">
                          {c.full_name ?? c.username}
                        </div>
                        <div className="text-xs text-stone-500 truncate">@{c.username}</div>
                      </div>
                      <span
                        className={`shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                          checked
                            ? "bg-[#8b5a3c] border-[#8b5a3c] text-white"
                            : "border-stone-300 bg-white"
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-stone-200/60 p-4 space-y-2 bg-[#f5efe2]">
          <button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            className="w-full h-12 rounded-2xl bg-stone-900 text-[#faf6ef] font-extrabold tracking-tight text-sm flex items-center justify-center gap-2 hover:bg-[#8b5a3c] transition disabled:opacity-50 btn-modern"
          >
            <Send className="h-4 w-4" strokeWidth={2.5} />
            {selected.size === 1
              ? t("share_send_one")
              : t("share_send", { n: selected.size || "—" })}
          </button>
          <button
            onClick={handleCopyLink}
            className="w-full h-10 rounded-2xl bg-transparent text-stone-600 hover:text-[#8b5a3c] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {linkCopied ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Copy className="h-4 w-4" strokeWidth={2.5} />}
            {linkCopied ? "Copied" : t("share_copy_link")}
          </button>
        </div>
      </div>
    </div>
  );
}
