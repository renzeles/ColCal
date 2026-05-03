"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function InviteFriendModal({ open, onClose }: Props) {
  const { t } = useT();
  const im = t.invite_modal;
  const [link, setLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLink(null);
      setCopied(false);
      setError(null);
      setGenerating(false);
    }
  }, [open]);

  async function generate() {
    setGenerating(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setError(im.not_authed);
      setGenerating(false);
      return;
    }
    const { data, error } = await supabase
      .from("friend_invites")
      .insert({ inviter_id: auth.user.id })
      .select("id")
      .single();
    setGenerating(false);
    if (error) { setError(error.message); return; }
    setLink(`${window.location.origin}/invite/${data.id}`);
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/10">
          <h2 className="text-base font-semibold tracking-tight">{im.title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-6 space-y-5">
          {!link ? (
            <>
              <div className="flex flex-col items-center text-center py-2">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                  <Link2 className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {im.description}
                </p>
                <p className="text-xs text-zinc-400 mt-1.5">{im.expires}</p>
              </div>
              <button
                onClick={generate}
                disabled={generating}
                className="w-full h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
              >
                {generating ? im.generating : im.generate}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5">
                <input
                  readOnly
                  value={link}
                  className="flex-1 bg-transparent border-0 outline-none text-sm font-mono truncate text-zinc-600 dark:text-zinc-300"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
              <button
                onClick={copy}
                className={`w-full h-11 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                }`}
              >
                {copied ? <><Check className="h-4 w-4" />{im.copied}</> : <><Copy className="h-4 w-4" />{im.copy}</>}
              </button>
            </>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
