"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight, UserCheck, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";

type Notification = {
  id: string;
  type: string;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Load unread count on mount + periodic refresh
  useEffect(() => {
    const supabase = createClient();
    let id: string | null = null;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function loadCount() {
      if (!id) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id)
        .eq("read", false);
      setUnread(count ?? 0);
    }

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      id = user.id;
      setUserId(id);
      await loadCount();
      interval = setInterval(loadCount, 30_000);
    })();

    return () => { if (interval) clearInterval(interval); };
  }, []);

  // Load notifications when opening
  useEffect(() => {
    if (!open || !userId) return;
    const supabase = createClient();
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8);
      setNotifs((data as Notification[]) ?? []);
      setLoading(false);
    })();
  }, [open, userId]);

  // Close on outside click + escape
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-8 w-8 flex items-center justify-center rounded-full text-stone-500 hover:text-[#8b5a3c] hover:bg-stone-100 transition cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={2.5} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-[#9a3c2b] text-white text-[9px] font-extrabold flex items-center justify-center leading-none ring-2 ring-[#f5efe2]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm sm:hidden" onClick={() => setOpen(false)} />
          <div
            className="
              z-50 bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden
              fixed left-2 right-2 top-16 sm:top-auto sm:bottom-auto
              sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-[360px]
              animate-in fade-in slide-in-from-top-2 duration-200
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
                Notifications
              </h3>
              {unread > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b5a3c] bg-[#fbf6ee] px-2 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>

            {/* List */}
            <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="text-sm text-stone-400 text-center py-10">Loading…</div>
              ) : notifs.length === 0 ? (
                <div className="text-center py-10 px-6">
                  <div className="text-3xl mb-2">🥐</div>
                  <p className="text-sm text-stone-500">All caught up.</p>
                </div>
              ) : (
                <ul>
                  {notifs.map((n) => (
                    <NotifRow key={n.id} notif={n} onClick={() => setOpen(false)} />
                  ))}
                </ul>
              )}
            </div>

            {/* Footer — open full view */}
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 py-3 border-t border-stone-100 text-xs font-bold uppercase tracking-wider text-[#8b5a3c] hover:bg-[#fbf6ee] transition cursor-pointer"
            >
              Open notifications
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function NotifRow({ notif, onClick }: { notif: Notification; onClick: () => void }) {
  const d = notif.data;

  let icon: React.ReactNode;
  let body: React.ReactNode;
  if (notif.type === "contact_request") {
    icon = <Avatar src={d.from_avatar || null} name={d.from_name} size="sm" />;
    body = <><span className="font-bold">{d.from_name || d.from_username}</span> wants to connect.</>;
  } else if (notif.type === "contact_accepted" || notif.type === "contact_accepted_done") {
    icon = (
      <div className="relative">
        <Avatar src={d.by_avatar || null} name={d.by_name} size="sm" />
        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
          <UserCheck className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </span>
      </div>
    );
    body = <><span className="font-bold">{d.by_name || d.by_username}</span> accepted your request.</>;
  } else if (notif.type === "contact_rejected_done") {
    icon = <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center"><UserPlus className="h-4 w-4 text-stone-400" /></div>;
    body = <span className="text-stone-400">Request rejected.</span>;
  } else if (notif.type === "event_invite") {
    icon = <div className="h-9 w-9 rounded-full bg-[#fbf6ee] flex items-center justify-center"><Bell className="h-4 w-4 text-[#8b5a3c]" /></div>;
    body = <><span className="font-bold">{d.creator_name || d.creator_username}</span> invited you to <span className="font-bold">{d.event_title}</span>.</>;
  } else if (notif.type === "event_share") {
    icon = <Avatar src={d.shared_by_avatar || null} name={d.shared_by_name} size="sm" />;
    body = <><span className="font-bold">{d.shared_by_name || d.shared_by_username}</span> shared an event: <span className="font-bold">{d.event_title}</span>.</>;
  } else {
    return null;
  }

  return (
    <li>
      <Link
        href="/notifications"
        onClick={onClick}
        className={`flex items-start gap-3 px-5 py-3 hover:bg-stone-50 transition cursor-pointer border-l-2 ${
          notif.read ? "border-transparent" : "border-[#8b5a3c] bg-[#fbf6ee]/40"
        }`}
      >
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-stone-700 leading-snug">{body}</p>
          <p className="text-[11px] text-stone-400 mt-0.5 font-medium">{timeAgo(notif.created_at)}</p>
        </div>
        {!notif.read && (
          <span className="h-2 w-2 rounded-full bg-[#8b5a3c] shrink-0 mt-2" />
        )}
      </Link>
    </li>
  );
}
