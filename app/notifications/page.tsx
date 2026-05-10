"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, UserCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { Toast, useToast } from "@/components/Toast";

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
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

export default function NotificationsPage() {
  const { user, loading: userLoading, signOut } = useUser();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifications((data as Notification[]) ?? []);
      setLoading(false);

      // Mark all as read
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    })();
  }, [user]);

  async function acceptRequest(notif: Notification) {
    if (!user || busyId) return;
    setBusyId(notif.id);
    const supabase = createClient();
    try {
      const { from_id, from_name, from_username, from_avatar } = notif.data;

      // Create mutual follows
      await Promise.all([
        supabase.from("follows").insert({ follower_id: user.id, following_id: from_id }).select(),
        supabase.from("follows").insert({ follower_id: from_id, following_id: user.id }).select(),
      ]);

      // Update contact request status
      await supabase
        .from("contact_requests")
        .update({ status: "accepted" })
        .eq("from_id", from_id)
        .eq("to_id", user.id);

      // Notify the requester
      await supabase.from("notifications").insert({
        user_id: from_id,
        type: "contact_accepted",
        data: {
          by_id: user.id,
          by_name: user.profile.full_name ?? user.profile.username ?? "Alguien",
          by_username: user.profile.username,
          by_avatar: user.profile.avatar_url,
        },
      });

      // Mark this notification as read and update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true, type: "contact_accepted_done" } : n))
      );
      toast.show("success", `¡Ahora sos contacto de ${from_name || from_username}!`);
    } catch {
      toast.show("error", "No se pudo aceptar la solicitud.");
    } finally {
      setBusyId(null);
    }
  }

  async function rejectRequest(notif: Notification) {
    if (!user || busyId) return;
    setBusyId(notif.id);
    const supabase = createClient();
    try {
      await supabase
        .from("contact_requests")
        .update({ status: "rejected" })
        .eq("from_id", notif.data.from_id)
        .eq("to_id", user.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, type: "contact_rejected_done" } : n))
      );
    } catch {
      toast.show("error", "No se pudo rechazar la solicitud.");
    } finally {
      setBusyId(null);
    }
  }

  if (userLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-zinc-500 text-sm">Cargando…</div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br bg-stone-50">
      <NavBar
        username={user.profile.username}
        fullName={user.profile.full_name}
        avatarUrl={user.profile.avatar_url}
        onSignOut={signOut}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-zinc-700" />
          <h1 className="text-lg font-semibold text-zinc-900">Notificaciones</h1>
        </div>

        {loading ? (
          <div className="text-sm text-zinc-500 text-center py-12">Cargando…</div>
        ) : notifications.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-16 bg-white rounded-2xl border border-zinc-200">
            <Bell className="h-8 w-8 mx-auto mb-3 text-zinc-300" />
            No tenés notificaciones todavía.
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                busy={busyId === notif.id}
                onAccept={() => acceptRequest(notif)}
                onReject={() => rejectRequest(notif)}
              />
            ))}
          </ul>
        )}
      </main>

      <Toast state={toast.state} />
    </div>
  );
}

function NotificationItem({
  notif,
  busy,
  onAccept,
  onReject,
}: {
  notif: Notification;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const d = notif.data;

  if (notif.type === "contact_request") {
    return (
      <li className="bg-white rounded-xl border border-zinc-200 p-4 flex items-start gap-3">
        <Link href={`/u/${d.from_username}`}>
          <Avatar src={d.from_avatar || null} name={d.from_name} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-900">
            <Link href={`/u/${d.from_username}`} className="font-semibold hover:underline">
              {d.from_name || d.from_username}
            </Link>
            {" "}quiere conectar contigo.
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(notif.created_at)}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onAccept}
              disabled={busy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 transition disabled:opacity-60"
            >
              <Check className="h-3 w-3" /> Aceptar
            </button>
            <button
              onClick={onReject}
              disabled={busy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition disabled:opacity-60"
            >
              <X className="h-3 w-3" /> Rechazar
            </button>
          </div>
        </div>
      </li>
    );
  }

  if (notif.type === "contact_accepted" || notif.type === "contact_accepted_done") {
    return (
      <li className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3">
        <Link href={`/u/${d.by_username}`}>
          <Avatar src={d.by_avatar || null} name={d.by_name} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-900">
            <Link href={`/u/${d.by_username}`} className="font-semibold hover:underline">
              {d.by_name || d.by_username}
            </Link>
            {" "}aceptó tu solicitud.
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(notif.created_at)}</p>
        </div>
        <UserCheck className="h-5 w-5 text-emerald-500 shrink-0" />
      </li>
    );
  }

  if (notif.type === "contact_rejected_done") {
    return (
      <li className="bg-white rounded-xl border border-zinc-100 p-4 flex items-center gap-3 opacity-60">
        <Avatar src={d.from_avatar || null} name={d.from_name} size="md" />
        <p className="text-sm text-zinc-500 flex-1">Solicitud rechazada.</p>
      </li>
    );
  }

  if (notif.type === "event_invite") {
    return (
      <li className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
          <Bell className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-900">
            <span className="font-semibold">{d.creator_name || d.creator_username}</span>
            {" "}te invitó a{" "}
            <span className="font-semibold">{d.event_title}</span>.
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{timeAgo(notif.created_at)}</p>
        </div>
      </li>
    );
  }

  return null;
}
