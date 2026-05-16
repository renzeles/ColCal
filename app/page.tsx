"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar, Check, ChevronLeft, ChevronRight,
  Pencil, Plus, RotateCcw, Search, Share2, Trash2, UserCheck, UserPlus,
  Send,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { Toast, useToast } from "@/components/Toast";
import { Landing } from "@/components/Landing";
import { FeedSkeleton } from "@/components/Skeleton";
import { NearbyEvents } from "@/components/NearbyEvents";
import { ChannelsSection } from "@/components/ChannelsSection";
import { ShareEventModal } from "@/components/ShareEventModal";
import { getEventColorStyles } from "@/lib/event-colors";
import type { Profile, SentEvent } from "@/lib/types";
import type { DemoEvent } from "@/components/NearbyEvents";
import { useT } from "@/lib/i18n";

type FeedItem = SentEvent & { creator: Profile };
type RsvpStatus = "accepted" | "declined";
type MainTab = "discover" | "mine" | "agenddi";
type AgendaSub = "contacts" | "channels";
type EventsFilter = "all" | "public" | "private";

const DAYS_LABEL = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// ─── Calendar (full) ─────────────────────────────────────────────────────────
function CalendarSection({ events }: { events: FeedItem[] }) {
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
      <div className="bg-white rounded-2xl card-shadow p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-base font-bold text-stone-800 capitalize font-extrabold tracking-tight">
            {MONTHS_EN[calMonth]} {calYear}
          </p>
          <button onClick={() => shiftMonth(1)} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {DAYS_LABEL.map((d, i) => (
            <div key={i} className="py-1 text-stone-400 font-medium">{d}</div>
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
                className={`relative py-2 rounded-xl font-medium transition cursor-pointer ${!day ? "invisible" : ""} ${
                  isSelected
                    ? "bg-[#8b5a3c] text-white"
                    : isToday
                    ? "bg-[#fbf6ee] text-[#6b4423]"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {day}
                {dayEvents.length > 0 && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#8b5a3c]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8 bg-white rounded-2xl card-shadow">
              No events this day.
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((ev) => (
                <CalendarEventRow key={ev.id} ev={ev} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CalendarEventRow({ ev }: { ev: FeedItem }) {
  const evStyles = getEventColorStyles(ev.color);
  return (
    <li className={`rounded-2xl border overflow-hidden card-shadow ${evStyles.card} ${evStyles.border}`}>
      <Link href={`/u/${ev.creator.username}/e/${ev.id}`} className="flex items-start gap-3 p-4 cursor-pointer">
        <Avatar src={ev.creator.avatar_url} name={ev.creator.full_name} size="sm" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-stone-900 truncate">{ev.title}</h3>
          <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {formatDate(ev.start_at)}
          </p>
          {ev.location && <p className="text-xs text-stone-500 mt-0.5 truncate">📍 {ev.location}</p>}
        </div>
      </Link>
    </li>
  );
}


// ─── Reusable bakery search input ────────────────────────────────────────────
function BakerySearchBar({
  value, onChange, placeholder, trailing,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#8b5a3c]" strokeWidth={2.5} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-stone-50 border border-stone-200 text-[15px] text-stone-900 font-medium focus:outline-none focus:border-[#8b5a3c] focus:bg-white focus:ring-4 focus:ring-[#8b5a3c]/8 transition-all placeholder:text-stone-400 placeholder:font-normal"
          style={{ paddingLeft: "3.25rem", paddingRight: "1rem", height: "3.25rem" }}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange("")}
        disabled={!value}
        style={{ height: "3.25rem", width: "3.25rem" }}
        className={`shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all btn-modern ${
          value
            ? "bg-[#fbf6ee] border-[#8b5a3c]/30 text-[#8b5a3c] hover:bg-white hover:border-[#8b5a3c] hover:rotate-[-90deg]"
            : "bg-stone-50 border-stone-200 text-stone-300 opacity-60 cursor-not-allowed"
        }`}
        aria-label="Clear"
      >
        <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.5} />
      </button>
      {trailing}
    </div>
  );
}

// ─── Contacts section ────────────────────────────────────────────────────────
function ContactsSection({ userId, userProfile }: { userId: string; userProfile: Profile }) {
  const { t } = useT();
  const toast = useToast();
  const [mutuals, setMutuals] = useState<Profile[]>([]);
  const [mutualIdSet, setMutualIdSet] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Invite to Agenddi
  const [inviteCopied, setInviteCopied] = useState(false);

  async function handleInvite() {
    const url = `${window.location.origin}/login?ref=${userProfile.username ?? ""}`;
    const text = `Sumate a Agenddi conmigo! ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Agenddi", text, url }); return; } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
      toast.show("success", "Link copied");
    } catch {
      toast.show("error", "Couldn't copy link");
    }
  }

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

      const profiles = mutualIds.length === 0
        ? []
        : (await supabase.from("profiles").select("*").in("id", mutualIds)).data ?? [];
      setMutuals((profiles as Profile[]) ?? []);
      setMutualIdSet(new Set(mutualIds));

      // Load suggestions
      const exclude = new Set([userId, ...followingIds]);
      const { data: suggestData } = await supabase
        .from("profiles").select("*").neq("id", userId).not("username", "is", null).limit(20);
      const filtered = ((suggestData as Profile[]) ?? []).filter((p) => !exclude.has(p.id)).slice(0, 12);
      setSuggestions(filtered);
      setLoading(false);
    })();
  }, [userId]);

  // Debounced people search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = query.trim();
    if (!q) { setSearchResults(null); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .neq("id", userId)
        .limit(30);
      setSearchResults((data as Profile[]) ?? []);
      setSearching(false);
    }, 300);
  }, [query, userId]);

  async function addContact(target: Profile) {
    if (busyId) return;
    setBusyId(target.id);
    const supabase = createClient();
    try {
      // Mutual follow — immediate, no request needed
      await supabase.from("follows").upsert(
        [
          { follower_id: userId, following_id: target.id },
          { follower_id: target.id, following_id: userId },
        ],
        { onConflict: "follower_id,following_id", ignoreDuplicates: true }
      );

      // Notify the other person (FYI, not actionable)
      await supabase.from("notifications").insert({
        user_id: target.id,
        type: "contact_added",
        data: {
          from_id: userId,
          from_name: userProfile.full_name ?? userProfile.username ?? "Someone",
          from_username: userProfile.username,
          from_avatar: userProfile.avatar_url,
        },
      });

      setMutualIdSet((prev) => new Set(prev).add(target.id));
      setMutuals((prev) => prev.find((p) => p.id === target.id) ? prev : [target, ...prev]);
      setSuggestions((prev) => prev.filter((p) => p.id !== target.id));
      toast.show("success", `Added ${target.full_name ?? target.username} as a contact.`);
    } catch {
      toast.show("error", "Couldn't add contact.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="text-sm text-stone-500 text-center py-8">{t("page_loading")}</div>;

  const isSearching = query.trim().length > 0;

  function renderUserRow(p: Profile) {
    const isMutual = mutualIdSet.has(p.id);
    return (
      <li key={p.id} className="bg-white rounded-xl card-shadow p-3 flex items-center gap-3">
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
        ) : (
          <button
            onClick={() => addContact(p)}
            disabled={busyId === p.id}
            className="flex items-center gap-1 px-3 h-8 rounded-full text-xs font-semibold bg-stone-900 text-[#faf6ef] hover:bg-[#8b5a3c] transition disabled:opacity-60"
          >
            <UserPlus className="h-3.5 w-3.5" /> {t("contacts_add")}
          </button>
        )}
      </li>
    );
  }

  const inviteButton = (
    <button
      onClick={handleInvite}
      style={{ height: "3.25rem", width: "3.25rem" }}
      className="shrink-0 rounded-2xl bg-stone-900 text-[#faf6ef] flex items-center justify-center hover:bg-[#8b5a3c] transition btn-modern"
      aria-label={t("contacts_invite_short")}
      title={inviteCopied ? t("contacts_copied") : t("contacts_invite_short")}
    >
      {inviteCopied ? (
        <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
      ) : (
        <Send className="h-[18px] w-[18px]" strokeWidth={2.5} />
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      <Toast state={toast.state} />

      <BakerySearchBar
        value={query}
        onChange={setQuery}
        placeholder={t("contacts_search_people")}
        trailing={inviteButton}
      />

      {/* Search results */}
      {isSearching ? (
        searching ? (
          <div className="text-sm text-stone-500 text-center py-8">{t("contacts_searching")}</div>
        ) : (searchResults?.length ?? 0) === 0 ? (
          <div className="text-sm text-stone-500 text-center py-12 bg-white rounded-2xl card-shadow">
            {t("contacts_search_empty")}
          </div>
        ) : (
          <ul className="space-y-2">
            {(searchResults ?? []).map((p) => renderUserRow(p))}
          </ul>
        )
      ) : (
        <>
          {/* Suggestions strip */}
          {suggestions.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
              {suggestions.map((p) => (
                <div key={p.id} className="snap-start shrink-0 w-32 bg-white rounded-2xl card-shadow p-3 flex flex-col items-center text-center">
                  <Link href={`/u/${p.username}`} className="mb-2">
                    <Avatar src={p.avatar_url} name={p.full_name} size="lg" />
                  </Link>
                  <Link href={`/u/${p.username}`} className="text-xs font-semibold text-stone-900 truncate w-full hover:underline">
                    {p.full_name ?? p.username}
                  </Link>
                  <p className="text-[10px] text-stone-500 truncate w-full">@{p.username}</p>
                  <button
                    onClick={() => addContact(p)}
                    disabled={busyId === p.id}
                    className="mt-2 w-full text-[11px] font-semibold text-[#faf6ef] bg-stone-900 hover:bg-[#8b5a3c] px-2 py-1.5 rounded-full transition disabled:opacity-60"
                  >
                    + {t("contacts_add")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mutuals list */}
          {mutuals.length === 0 ? (
            <div className="text-sm text-stone-500 text-center py-12 bg-white rounded-2xl card-shadow">
              {t("contacts_empty_contacts")}
            </div>
          ) : (
            <ul className="space-y-2">{mutuals.map((p) => renderUserRow(p))}</ul>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, loading: userLoading, signOut } = useUser(false);
  const toast = useToast();
  const router = useRouter();
  const { t } = useT();

  const [mainTab, setMainTab] = useState<MainTab>("discover");
  const [agendaSub, setAgendaSub] = useState<AgendaSub>("contacts");
  const [eventsFilter, setEventsFilter] = useState<EventsFilter>("all");
  const [sharingEvent, setSharingEvent] = useState<FeedItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [privateItems, setPrivateItems] = useState<FeedItem[]>([]);
  const [mineItems, setMineItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [myRsvpMap, setMyRsvpMap] = useState<Map<string, RsvpStatus>>(new Map());
  const [rsvpCounts, setRsvpCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      setLoading(true);

      const privateQuery = user.email
        ? supabase.from("sent_events").select("*")
            .eq("visibility", "private")
            .contains("attendee_emails", [user.email])
            .neq("creator_id", user.id)
            .order("start_at", { ascending: false }).limit(100)
        : null;

      const mineQuery = supabase.from("sent_events").select("*")
        .eq("creator_id", user.id)
        .order("start_at", { ascending: false }).limit(100);

      const [privateRes, mineRes] = await Promise.all([
        privateQuery ?? Promise.resolve({ data: [] as SentEvent[] }),
        mineQuery,
      ]);

      const allCreatorIds = Array.from(new Set([
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
          .map((e) => { const c = profileMap.get(e.creator_id); return c ? { ...e, creator: c } : null; })
          .filter((x): x is FeedItem => x !== null);
      }

      const resolvedPrivate = withCreator((privateRes.data ?? []) as SentEvent[]);
      const resolvedMine = withCreator((mineRes.data ?? []) as SentEvent[]);

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

  function shareEvent(ev: FeedItem) {
    setSharingEvent(ev);
  }

  async function deleteMineEvent(evId: string, title: string) {
    if (deletingId || !confirm(`Delete "${title}"?`)) return;
    setDeletingId(evId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("sent_events").delete().eq("id", evId);
      if (error) throw error;
      setMineItems((prev) => prev.filter((e) => e.id !== evId));
    } catch {
      toast.show("error", "Couldn't delete event.");
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
        visibility: "private",
        image_url: ev.image,
        color: "violet",
        source: "joined",
      }).select("*").single();
      if (error) throw error;
      const creator = user.profile as Profile;
      setMineItems((prev) => [{ ...(data as SentEvent), creator }, ...prev]);
      toast.show("success", `"${ev.title}" added.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      toast.show("error", msg ? `Error: ${msg}` : "Couldn't add event.");
    }
  }

  const allMyEvents = useMemo(() => [...mineItems, ...privateItems], [mineItems, privateItems]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-500 text-sm">{t("page_loading")}</div>
      </div>
    );
  }

  if (!user) return <Landing />;

  return (
    <div className="min-h-screen bakery-bg">
      <NavBar
        username={user.profile.username}
        fullName={user.profile.full_name}
        avatarUrl={user.profile.avatar_url}
        onSignOut={signOut}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Main tab bar — modern bold */}
        <div className="flex gap-4 sm:gap-6 border-b border-stone-200/70">
          {(["discover", "mine", "agenddi"] as const).map((tab) => {
            const labels = {
              discover: t("page_tab_discover"),
              mine: t("page_tab_events"),
              agenddi: t("page_tab_agenddi"),
            };
            return (
              <button
                key={tab}
                onClick={() => setMainTab(tab)}
                className={`relative pb-3 pt-1 text-sm sm:text-[15px] font-extrabold tracking-tight transition-colors whitespace-nowrap ${
                  mainTab === tab
                    ? "text-stone-900"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                {labels[tab]}
                {mainTab === tab && (
                  <span className="absolute -bottom-px left-0 right-0 h-[3px] bg-[#8b5a3c] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Discover ── */}
        {mainTab === "discover" && (
          <NearbyEvents onAdd={addDemoEvent} />
        )}

        {/* ── Events ── */}
        {mainTab === "mine" && (() => {
          const combinedEvents = [...mineItems, ...privateItems].sort(
            (a, b) => b.start_at.localeCompare(a.start_at)
          );
          const visibleEvents = combinedEvents.filter((ev) =>
            eventsFilter === "all" ? true : ev.visibility === eventsFilter
          );
          return (
          <div className="space-y-5">
            {/* Filter (left) + Create (right) */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex rounded-full bg-stone-100 p-1">
                {(["all", "public", "private"] as const).map((f) => {
                  const labels = {
                    all: t("filter_all"),
                    public: t("page_filter_public"),
                    private: t("page_filter_private"),
                  };
                  return (
                    <button
                      key={f}
                      onClick={() => setEventsFilter(f)}
                      className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition ${
                        eventsFilter === f
                          ? "bg-[#8b5a3c] text-white shadow-sm"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      {labels[f]}
                    </button>
                  );
                })}
              </div>
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-stone-900 text-[#faf6ef] text-sm font-semibold hover:bg-[#8b5a3c] transition btn-modern"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} /> {t("create_event_cta")}
              </Link>
            </div>

            {/* Calendar (filtered) */}
            {!loading && <CalendarSection events={visibleEvents} />}

            {/* Events list */}
            {loading ? (
              <FeedSkeleton />
            ) : visibleEvents.length === 0 ? (
              <div className="text-sm text-stone-500 text-center py-12 bg-white rounded-2xl card-shadow">
                {t("page_no_mine")}
              </div>
            ) : (
              <ul className="space-y-3">
                {visibleEvents.map((ev) => {
                  const evStyles = getEventColorStyles(ev.color);
                  const acceptedCount = rsvpCounts.get(ev.id) ?? 0;
                  const isMine = ev.creator_id === user.id;
                  const isJoined = ev.source === "joined";
                  const canEdit = isMine && !isJoined;
                  const canDelete = isMine;
                  return (
                    <li
                      key={ev.id}
                      className={`rounded-2xl overflow-hidden card-shadow card-shadow-hover ${evStyles.card} border ${evStyles.border}`}
                    >
                      {ev.image_url && (
                        <Link href={`/u/${ev.creator.username}/e/${ev.id}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ev.image_url} alt={ev.title} className="w-full h-44 object-cover" />
                        </Link>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/u/${ev.creator.username}/e/${ev.id}`} className="block hover:underline flex-1 min-w-0">
                            <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">{ev.title}</h3>
                          </Link>
                          <div className="flex items-center gap-1 shrink-0">
                            {acceptedCount > 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                <Check className="h-3 w-3" /> {acceptedCount}
                              </span>
                            )}
                            {isJoined && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fbf6ee] text-[#8b5a3c]">
                                Joined
                              </span>
                            )}
                            {!isMine && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                                Invited
                              </span>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => router.push(`/create?edit=${ev.id}`)}
                                aria-label="Edit"
                                className="h-7 w-7 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => shareEvent(ev)}
                              aria-label="Share"
                              className="h-7 w-7 flex items-center justify-center rounded-full text-stone-400 hover:text-[#8b5a3c] hover:bg-[#fbf6ee] transition"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => deleteMineEvent(ev.id, ev.title)}
                                disabled={deletingId === ev.id}
                                aria-label="Delete"
                                className="h-7 w-7 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-stone-500 mt-1.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(ev.start_at)}
                        </p>
                        {ev.location && <p className="text-xs text-stone-500 mt-0.5">📍 {ev.location}</p>}
                        {ev.description && (
                          <p className="text-sm text-stone-700 mt-2 whitespace-pre-line line-clamp-3">{ev.description}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          );
        })()}

        {/* ── Mi Agenddi ── */}
        {mainTab === "agenddi" && (
          <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-2 bg-white rounded-2xl card-shadow p-1.5">
              {(["contacts", "channels"] as const).map((s) => {
                const labels = {
                  contacts: t("agenda_sub_contacts"),
                  channels: t("agenda_sub_channels"),
                };
                return (
                  <button
                    key={s}
                    onClick={() => setAgendaSub(s)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                      agendaSub === s
                        ? "bg-[#8b5a3c] text-white"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {labels[s]}
                  </button>
                );
              })}
            </div>

            {agendaSub === "contacts" && (
              <ContactsSection userId={user.id} userProfile={user.profile as Profile} />
            )}
            {agendaSub === "channels" && (
              <ChannelsSection userId={user.id} />
            )}
          </div>
        )}
      </main>

      <Toast state={toast.state} />

      {sharingEvent && (
        <ShareEventModal
          event={sharingEvent}
          userId={user.id}
          userProfile={user.profile as Profile}
          onClose={() => setSharingEvent(null)}
          onSuccess={(count) =>
            toast.show("success", `${t("share_done", { n: count })}`)
          }
        />
      )}
    </div>
  );
}
