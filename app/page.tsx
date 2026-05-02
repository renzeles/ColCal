"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { CalendarArea } from "@/components/calendar/CalendarArea";
import { EventModal } from "@/components/calendar/EventModal";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent, SidebarSelection } from "@/lib/types";

type UserInfo = {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
};

export default function HomePage() {
  const [selection, setSelection] = useState<SidebarSelection>({ kind: "self" });
  const [user, setUser] = useState<UserInfo | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const u = auth.user;
      if (!u) {
        window.location.href = "/login";
        return;
      }
      setUser({
        id: u.id,
        name:
          (u.user_metadata?.full_name as string) ??
          (u.user_metadata?.name as string) ??
          null,
        email: u.email ?? null,
        avatar: (u.user_metadata?.avatar_url as string) ?? null,
      });

      const { data: rows } = await supabase
        .from("events")
        .select("*")
        .order("start_at", { ascending: true });
      setEvents((rows ?? []) as CalendarEvent[]);
      setLoading(false);
    })();
  }, []);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-zinc-400">
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        selection={selection}
        onSelect={setSelection}
        userName={user.name}
        userAvatar={user.avatar}
        userEmail={user.email}
      />
      <CalendarArea
        selection={selection}
        events={events}
        onNewEvent={() => setModalOpen(true)}
      />
      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={user.id}
        onCreated={(ev) =>
          setEvents((prev) =>
            [...prev, ev].sort(
              (a, b) =>
                new Date(a.start_at).getTime() -
                new Date(b.start_at).getTime()
            )
          )
        }
      />
    </div>
  );
}
