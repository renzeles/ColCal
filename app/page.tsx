"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar, type Friend } from "@/components/sidebar/Sidebar";
import { CalendarArea } from "@/components/calendar/CalendarArea";
import { EventModal } from "@/components/calendar/EventModal";
import { createClient } from "@/lib/supabase/client";
import type {
  AppNotification,
  CalendarEvent,
  GroupItem,
  GroupMember,
  PermissionStatus,
  SidebarSelection,
} from "@/lib/types";
import { useT } from "@/lib/i18n";

type UserInfo = {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
};

export default function HomePage() {
  const { t } = useT();
  const [selection, setSelection] = useState<SidebarSelection>({ kind: "self" });
  const [user, setUser] = useState<UserInfo | null>(null);

  // Own events
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // Friends
  const [friends, setFriends] = useState<Friend[]>([]);
  // Groups
  const [groups, setGroups] = useState<GroupItem[]>([]);

  // Whatever is shown in the calendar area
  const [displayedEvents, setDisplayedEvents] = useState<CalendarEvent[]>([]);

  // Friend calendar permission
  const [friendPermission, setFriendPermission] = useState<PermissionStatus>("none");
  const [requestingAccess, setRequestingAccess] = useState(false);

  // Group members
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Event modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const u = auth.user;
      if (!u) { window.location.href = "/login"; return; }
      setUser({
        id: u.id,
        name: (u.user_metadata?.full_name as string) ?? (u.user_metadata?.name as string) ?? null,
        email: u.email ?? null,
        avatar: (u.user_metadata?.avatar_url as string) ?? null,
      });

      const [{ data: rows }, { data: friendRows }, { data: groupRows }, { data: notifRows }] =
        await Promise.all([
          supabase.from("events").select("*").is("group_id", null).order("start_at", { ascending: true }),
          supabase.rpc("list_friends"),
          supabase.rpc("list_my_groups"),
          supabase.rpc("get_notifications"),
        ]);
      setEvents((rows ?? []) as CalendarEvent[]);
      setDisplayedEvents((rows ?? []) as CalendarEvent[]);
      setFriends((friendRows ?? []) as Friend[]);
      setGroups((groupRows ?? []) as GroupItem[]);
      setNotifications((notifRows ?? []) as AppNotification[]);
      setLoading(false);
    })();
  }, []);

  // When selection changes, load the right events + metadata
  useEffect(() => {
    if (selection.kind === "self") {
      setDisplayedEvents(events);
      setFriendPermission("none");
      setGroupMembers([]);
      return;
    }
    const supabase = createClient();
    if (selection.kind === "friend") {
      const friendId = selection.id;
      setGroupMembers([]);
      (async () => {
        const [{ data: evRows }, { data: permStatus }] = await Promise.all([
          supabase.rpc("get_friend_events", { _friend_id: friendId }),
          supabase.rpc("get_calendar_permission_status", { _owner_id: friendId }),
        ]);
        setDisplayedEvents((evRows ?? []) as CalendarEvent[]);
        setFriendPermission((permStatus as PermissionStatus) ?? "none");
      })();
    } else if (selection.kind === "group") {
      const groupId = selection.id;
      setFriendPermission("none");
      (async () => {
        const [{ data: evRows }, { data: memberRows }] = await Promise.all([
          supabase.rpc("get_group_events", { _group_id: groupId }),
          supabase.rpc("get_group_members", { _group_id: groupId }),
        ]);
        setDisplayedEvents((evRows ?? []) as CalendarEvent[]);
        setGroupMembers((memberRows ?? []) as GroupMember[]);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  // Keep own events in sync when viewing self
  useEffect(() => {
    if (selection.kind === "self") setDisplayedEvents(events);
  }, [events, selection]);

  async function handleRequestAccess() {
    if (selection.kind !== "friend") return;
    setRequestingAccess(true);
    const supabase = createClient();
    await supabase.rpc("request_calendar_access", { _owner_id: selection.id });
    setFriendPermission("pending");
    setRequestingAccess(false);
  }

  async function handleRespondNotification(fromUserId: string, approved: boolean) {
    const supabase = createClient();
    await supabase.rpc("respond_calendar_request", { _viewer_id: fromUserId, _approved: approved });
    setNotifications((prev) =>
      prev.map((n) =>
        n.type === "calendar_request" && n.from_user_id === fromUserId ? { ...n, read: true } : n
      )
    );
  }

  const handleMarkNotificationsRead = useCallback(async () => {
    const supabase = createClient();
    await supabase.rpc("mark_notifications_read");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
    if (selection.kind === "group") {
      setDisplayedEvents((prev) =>
        [...prev, ev].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      );
    } else {
      setEvents((prev) =>
        [...prev, ev].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      );
    }
  }

  function handleUpdated(ev: CalendarEvent) {
    const update = (prev: CalendarEvent[]) =>
      prev.map((e) => (e.id === ev.id ? ev : e))
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
    setEvents(update);
    setDisplayedEvents(update);
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDisplayedEvents((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-zinc-400">
        {t.loading}
      </div>
    );
  }

  const activeGroupId = selection.kind === "group" ? selection.id : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        selection={selection}
        onSelect={setSelection}
        userName={user.name}
        userAvatar={user.avatar}
        userEmail={user.email}
        friends={friends}
        groups={groups}
      />
      <CalendarArea
        selection={selection}
        events={displayedEvents}
        onNewEvent={openCreate}
        onEventClick={openEdit}
        notifications={notifications}
        onRespondNotification={handleRespondNotification}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        friendPermission={friendPermission}
        onRequestAccess={handleRequestAccess}
        requestingAccess={requestingAccess}
        groupMembers={groupMembers}
      />
      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={user.id}
        event={editingEvent}
        groupId={activeGroupId}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
