"use client";

import { useState } from "react";
import { LayoutGrid, List, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppNotification, CalendarEvent, CalendarView, GroupMember, PermissionStatus, SidebarSelection } from "@/lib/types";
import { GridCalendar } from "./GridCalendar";
import { EventFeed } from "./EventFeed";
import { useT } from "@/lib/i18n";
import { NotificationBell } from "@/components/notifications/NotificationBell";

type Props = {
  selection: SidebarSelection;
  events: CalendarEvent[];
  onNewEvent?: () => void;
  onEventClick?: (e: CalendarEvent) => void;
  notifications: AppNotification[];
  onRespondNotification: (fromUserId: string, approved: boolean) => Promise<void>;
  onMarkNotificationsRead: () => void;
  friendPermission?: PermissionStatus;
  onRequestAccess?: () => void;
  requestingAccess?: boolean;
  groupMembers?: GroupMember[];
};

export function CalendarArea({
  selection,
  events,
  onNewEvent,
  onEventClick,
  notifications,
  onRespondNotification,
  onMarkNotificationsRead,
  friendPermission,
  onRequestAccess,
  requestingAccess,
  groupMembers,
}: Props) {
  const { t } = useT();
  const [view, setView] = useState<CalendarView>("grid");
  const isFriend = selection.kind === "friend";
  const isGroup = selection.kind === "group";

  const title = selection.kind === "self"
    ? t.sidebar.my_calendar
    : "name" in selection ? selection.name : t.sidebar.my_calendar;
  const friendAvatar = selection.kind === "friend" ? selection.avatar : null;

  return (
    <div className="flex-1 h-screen flex flex-col">
      <header className="px-8 pt-6 pb-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          {isFriend && (
            friendAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={friendAvatar} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-black/5 dark:ring-white/10 shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shrink-0" />
            )
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
            {events.length}{" "}
            {events.length === 1 ? t.calendar.events_one : t.calendar.events_other}
          </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <NotificationBell
            notifications={notifications}
            onRespond={onRespondNotification}
            onMarkRead={onMarkNotificationsRead}
          />
          {!isFriend && (
            <button
              onClick={onNewEvent}
              className="ml-1 h-9 px-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <Plus className="h-4 w-4" />
              {t.calendar.new_button}
            </button>
          )}

        </div>
      </header>

      {isFriend && friendPermission !== "approved" && (
        <FriendAccessBanner
          status={friendPermission ?? "none"}
          onRequest={onRequestAccess}
          requesting={requestingAccess}
        />
      )}

      {isGroup && groupMembers && groupMembers.length > 0 && (
        <GroupMembersStrip members={groupMembers} />
      )}

      <div className="flex-1 overflow-hidden p-6">
        {view === "grid" ? (
          <div className="h-full bg-white dark:bg-zinc-900/40 rounded-2xl border border-black/5 dark:border-white/5 p-4 shadow-sm">
            <GridCalendar events={events} onEventClick={isFriend ? undefined : onEventClick} />
          </div>
        ) : (
          <EventFeed events={events} onEventClick={isFriend ? undefined : onEventClick} />
        )}
      </div>
    </div>
  );
}

function GroupMembersStrip({ members }: { members: GroupMember[] }) {
  const { t } = useT();
  return (
    <div className="mx-8 mt-3 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 flex items-center gap-3">
      <div className="flex items-center -space-x-2">
        {members.slice(0, 8).map((m) => (
          <div key={m.id} title={`${m.full_name ?? "?"} (${m.role})`} className="ring-2 ring-white dark:ring-zinc-900 rounded-full">
            {m.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold",
                m.role === "admin" ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-gradient-to-br from-zinc-400 to-zinc-500"
              )}>
                {(m.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {members.length > 8 && (
          <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700 ring-2 ring-white dark:ring-zinc-900 flex items-center justify-center text-[9px] font-bold text-zinc-500">
            +{members.length - 8}
          </div>
        )}
      </div>
      <span className="text-xs text-zinc-500">{t.group.members_count(members.length)}</span>
    </div>
  );
}

function FriendAccessBanner({
  status,
  onRequest,
  requesting,
}: {
  status: PermissionStatus;
  onRequest?: () => void;
  requesting?: boolean;
}) {
  const { t } = useT();
  const pr = t.privacy;

  return (
    <div className="mx-8 mt-3 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span>{pr.friend_public_only}</span>
      </div>
      {status === "none" && (
        <button
          onClick={onRequest}
          disabled={requesting}
          className="shrink-0 h-7 px-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
        >
          {requesting ? pr.requesting : pr.request_full_access}
        </button>
      )}
      {status === "pending" && (
        <span className="shrink-0 text-xs text-zinc-400 italic">{pr.access_pending}</span>
      )}
      {status === "rejected" && (
        <span className="shrink-0 text-xs text-red-400">{pr.access_rejected}</span>
      )}
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: CalendarView;
  onChange: (v: CalendarView) => void;
}) {
  const { t } = useT();
  return (
    <div className="inline-flex items-center p-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5">
      <ToggleBtn active={view === "grid"} onClick={() => onChange("grid")} label={t.calendar.grid_label}>
        <LayoutGrid className="h-3.5 w-3.5" />
      </ToggleBtn>
      <ToggleBtn active={view === "feed"} onClick={() => onChange("feed")} label={t.calendar.feed_label}>
        <List className="h-3.5 w-3.5" />
      </ToggleBtn>
    </div>
  );
}

function ToggleBtn({
  active, onClick, label, children,
}: {
  active: boolean; onClick: () => void; label: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition",
        active
          ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white"
          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      )}
    >
      {children}
      {label}
    </button>
  );
}
