"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { NearbyEvents } from "@/components/NearbyEvents";
import { getEventColorStyles } from "@/lib/event-colors";
import type { Profile, SentEvent } from "@/lib/types";

type FeedItem = SentEvent & { creator: Profile };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Landing() {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: events } = await supabase
        .from("sent_events")
        .select("*")
        .eq("visibility", "public")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(6);

      const ids = Array.from(new Set((events ?? []).map((e) => e.creator_id)));
      if (ids.length === 0) {
        setItems([]);
        return;
      }
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
      const profileMap = new Map<string, Profile>();
      (profiles ?? []).forEach((p) => profileMap.set(p.id, p as Profile));

      setItems(
        (events ?? [])
          .map((e) => {
            const creator = profileMap.get(e.creator_id);
            return creator ? ({ ...(e as SentEvent), creator } as FeedItem) : null;
          })
          .filter((x): x is FeedItem => x !== null)
      );
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-900">Agenddi</h1>
          <Link
            href="/login"
            className="px-4 h-9 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition flex items-center"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-16 space-y-12">
        <section className="text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 tracking-tight">
            Descubrí
          </h2>
        </section>

        {items.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-violet-600" /> Eventos públicos
              </h3>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3">
              {items.map((ev) => {
                const evStyles = getEventColorStyles(ev.color);
                return (
                <li key={ev.id} className={`rounded-2xl border overflow-hidden shadow-sm ${evStyles.card} ${evStyles.border}`}>
                  <Link href={`/u/${ev.creator.username}/e/${ev.id}`}>
                    {ev.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ev.image_url} alt={ev.title} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar src={ev.creator.avatar_url} name={ev.creator.full_name} size="sm" />
                        <span className="text-xs text-zinc-500 truncate">
                          @{ev.creator.username}
                        </span>
                      </div>
                      <h4 className="font-medium text-zinc-900 truncate">{ev.title}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(ev.start_at)}
                      </p>
                      {ev.location && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">📍 {ev.location}</p>
                      )}
                    </div>
                  </Link>
                </li>
                );
              })}
            </ul>
          </section>
        )}

        <NearbyEvents />

        <footer className="text-center text-xs text-zinc-400 pt-8">
          Agenddi · {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
