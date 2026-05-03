"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";

type Props = {
  notifications: AppNotification[];
  onRespond: (fromUserId: string, approved: boolean) => Promise<void>;
  onMarkRead: () => void;
};

export function NotificationBell({ notifications, onRespond, onMarkRead }: Props) {
  const { t, lang } = useT();
  const n = t.notifications;
  const dfLocale = lang === "es" ? es : enUS;
  const [open, setOpen] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((x) => !x.read).length;

  useEffect(() => {
    if (!open) return;
    onMarkRead();
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onMarkRead]);

  async function handleRespond(fromUserId: string, approved: boolean) {
    setResponding(fromUserId + (approved ? "_yes" : "_no"));
    await onRespond(fromUserId, approved);
    setResponding(null);
  }

  function notifText(notif: AppNotification) {
    const name = notif.from_user_name ?? n.someone;
    if (notif.type === "calendar_request") return n.calendar_request(name);
    if (notif.type === "calendar_approved") return n.calendar_approved(name);
    if (notif.type === "calendar_rejected") return n.calendar_rejected(name);
    return notif.type;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-80 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
            <h3 className="text-sm font-semibold">{n.title}</h3>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-xs text-zinc-400 text-center">{n.empty}</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-black/3 dark:border-white/5 last:border-0 ${
                    !notif.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notif.from_user_avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={notif.from_user_avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
                        {notifText(notif)}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: dfLocale,
                        })}
                      </p>

                      {notif.type === "calendar_request" && notif.from_user_id && (
                        <div className="flex gap-1.5 mt-2">
                          <button
                            onClick={() => handleRespond(notif.from_user_id!, true)}
                            disabled={!!responding}
                            className="h-6 px-2.5 rounded-full bg-blue-500 text-white text-[10px] font-medium hover:bg-blue-600 transition disabled:opacity-50"
                          >
                            {responding === notif.from_user_id + "_yes" ? n.responding : n.approve}
                          </button>
                          <button
                            onClick={() => handleRespond(notif.from_user_id!, false)}
                            disabled={!!responding}
                            className="h-6 px-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
                          >
                            {responding === notif.from_user_id + "_no" ? n.responding : n.reject}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
