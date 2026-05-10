"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    async function load() {
      if (!userId) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      setUnread(count ?? 0);
    }

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
      await load();
      // Poll every 30 seconds for new notifications
      const t = setInterval(load, 30_000);
      return () => clearInterval(t);
    })();
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative h-8 w-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
      aria-label="Notificaciones"
    >
      <Bell className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
