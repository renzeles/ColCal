"use client";

import { useEffect, useState } from "react";
import { Sidebar, type Friend } from "@/components/sidebar/Sidebar";
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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
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

      const [{ data: rows }, { data: friendRows }] = await Promise.all([
        supabase.from("events").select("*").order("start_at", { ascending: true }),
        supabase.rpc("list_friends"),
      ]);
      setEvents((rows ?? []) as CalendarEvent[]);
      setFriends((friendRows ?? []) as Friend[]);
      setLoading(false);
    })();
  }, []);

  function openCreate() {
    setEditingEvent(null);
    setModalOpen(true);
  }

  function openEdit(ev: CalendarEvent) {
    setEditingEvent(ev);
    setModalOpen(true);
  }

  function handleCreated(ev: CalendarEvent) {
    setEvents((prev) =>
      [...prev, ev].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      )
    );
  }

  function handleUpdated(ev: CalendarEvent) {
    setEvents((prev) =>
      prev
        .map((e) => (e.id === ev.id ? ev : e))
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    );
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

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
        friends={friends}
      />
      <CalendarArea
        selection={selection}
        events={events}
        onNewEvent={openCreate}
        onEventClick={openEdit}
      />
      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={user.id}
        event={editingEvent}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
