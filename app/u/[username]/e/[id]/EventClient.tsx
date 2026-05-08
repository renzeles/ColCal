"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Share2, Check, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { Toast, useToast } from "@/components/Toast";
import type { Profile, SentEvent } from "@/lib/types";

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function googleCalendarLink(ev: SentEvent): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = fmt(new Date(ev.start_at));
  const end = fmt(new Date(ev.end_at));
  const url = new URL("https://calendar.google.com/calendar/u/0/r/eventedit");
  url.searchParams.set("text", ev.title);
  url.searchParams.set("dates", `${start}/${end}`);
  if (ev.description) url.searchParams.set("details", ev.description);
  if (ev.location) url.searchParams.set("location", ev.location);
  return url.toString();
}

type Props = {
  event: SentEvent;
  creator: Profile;
};

export function EventClient({ event, creator }: Props) {
  const { user, signOut } = useUser(false);
  const router = useRouter();
  const toast = useToast();
  const [shareCopied, setShareCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting || !confirm(`¿Borrar "${event.title}"?`)) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("sent_events").delete().eq("id", event.id);
      if (error) throw error;
      router.push(`/u/${creator.username}`);
    } catch {
      toast.show("error", "No se pudo borrar el evento.");
      setDeleting(false);
    }
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${event.title} — ${formatDateLong(event.start_at)}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {user ? (
        <NavBar
          username={user.profile.username}
          fullName={user.profile.full_name}
          avatarUrl={user.profile.avatar_url}
          onSignOut={signOut}
        />
      ) : (
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-zinc-900">
              Agenddi
            </Link>
            <Link
              href="/login"
              className="px-3 sm:px-4 h-9 rounded-full bg-zinc-900 text-white text-xs sm:text-sm font-semibold hover:bg-zinc-800 transition flex items-center"
            >
              Iniciar sesión
            </Link>
          </div>
        </header>
      )}

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <article className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
          )}

          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
                {event.title}
              </h1>
              {user?.id === creator.id && (
                <div className="flex items-center gap-1 shrink-0 mt-1">
                  <Link
                    href={`/create?edit=${event.id}`}
                    className="h-9 w-9 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition"
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="h-9 w-9 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                    aria-label="Borrar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div>
              <div className="mt-3 flex flex-col gap-1.5 text-sm text-zinc-600">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  {formatDateLong(event.start_at)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>

            {event.description && (
              <p className="text-zinc-700 whitespace-pre-line">{event.description}</p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href={googleCalendarLink(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                <Calendar className="h-4 w-4" />
                Agregar al calendario
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-zinc-100 text-zinc-700 text-sm font-semibold hover:bg-zinc-200 transition"
              >
                {shareCopied ? (
                  <>
                    <Check className="h-4 w-4" /> Link copiado
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" /> Compartir
                  </>
                )}
              </button>
            </div>

            <div className="border-t border-zinc-200 pt-4">
              <Link
                href={`/u/${creator.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar src={creator.avatar_url} name={creator.full_name} size="md" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">Organizado por</p>
                  <p className="font-medium text-zinc-900 group-hover:underline truncate">
                    {creator.full_name ?? creator.username}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">@{creator.username}</p>
                </div>
              </Link>
            </div>
          </div>
        </article>

        {!user && (
          <section className="bg-violet-50 border border-violet-200 rounded-2xl p-5 text-center">
            <p className="text-sm text-zinc-700 mb-3">
              Sumate a Agenddi para crear y compartir tus propios eventos.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition"
            >
              Crear mi cuenta
            </Link>
          </section>
        )}
      </main>

      <Toast state={toast.state} />
    </div>
  );
}
