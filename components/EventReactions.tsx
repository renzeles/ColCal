"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMOJIS = ["👍", "❤️", "🔥", "🙋", "🎉", "✨"];

type Counts = Map<string, number>; // emoji → count
type Mine = Set<string>;            // emojis I reacted with

export function EventReactions({ eventId, userId, compact = false }: { eventId: string; userId: string; compact?: boolean }) {
  const [counts, setCounts] = useState<Counts>(new Map());
  const [mine, setMine] = useState<Mine>(new Set());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from("event_reactions")
        .select("emoji, user_id")
        .eq("event_id", eventId);
      const c: Counts = new Map();
      const m: Mine = new Set();
      ((data ?? []) as { emoji: string; user_id: string }[]).forEach((r) => {
        c.set(r.emoji, (c.get(r.emoji) ?? 0) + 1);
        if (r.user_id === userId) m.add(r.emoji);
      });
      setCounts(c);
      setMine(m);
    })();
  }, [eventId, userId]);

  async function toggle(emoji: string) {
    if (busy) return;
    setBusy(true);
    const supabase = createClient();
    try {
      if (mine.has(emoji)) {
        await supabase.from("event_reactions").delete()
          .eq("event_id", eventId).eq("user_id", userId).eq("emoji", emoji);
        setCounts((c) => { const n = new Map(c); n.set(emoji, Math.max(0, (n.get(emoji) ?? 1) - 1)); return n; });
        setMine((m) => { const n = new Set(m); n.delete(emoji); return n; });
      } else {
        await supabase.from("event_reactions").insert({ event_id: eventId, user_id: userId, emoji });
        setCounts((c) => { const n = new Map(c); n.set(emoji, (n.get(emoji) ?? 0) + 1); return n; });
        setMine((m) => new Set(m).add(emoji));
      }
    } catch { /* silent */ }
    finally { setBusy(false); setOpen(false); }
  }

  const activeEmojis = Array.from(counts.entries()).filter(([, c]) => c > 0);

  return (
    <div className="flex items-center gap-1.5 flex-wrap relative">
      {activeEmojis.map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => toggle(emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition ${
            mine.has(emoji)
              ? "bg-[#8b5a3c] text-white"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          <span>{emoji}</span>
          <span className="tabular-nums">{count}</span>
        </button>
      ))}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="React"
        className={`h-7 w-7 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100 transition ${compact ? "text-sm" : "text-base"}`}
      >
        ＋
      </button>
      {open && (
        <div
          className="absolute z-20 left-0 -top-12 bg-white rounded-2xl card-shadow p-2 flex items-center gap-1"
          onMouseLeave={() => setOpen(false)}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => toggle(emoji)}
              className="h-9 w-9 rounded-xl hover:bg-stone-100 flex items-center justify-center text-lg transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
