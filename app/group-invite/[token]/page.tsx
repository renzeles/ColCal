"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";

type InviteInfo = {
  group_id: string | null;
  group_name: string | null;
  group_description: string | null;
  inviter_name: string | null;
  inviter_avatar: string | null;
  role: string | null;
  valid: boolean;
  reason: string | null;
};

export default function GroupInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { t } = useT();
  const g = t.group;

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setAuthed(!!auth.user);
      setAuthChecked(true);

      const { data, error } = await supabase.rpc("get_group_invite_info", { _token: token });
      if (error) { setError(error.message); return; }
      const row = (data as InviteInfo[])?.[0] ?? null;
      setInfo(row);
    })();
  }, [token]);

  async function handleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/group-invite/${token}` },
    });
  }

  async function handleJoin() {
    setJoining(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("accept_group_invite", { _token: token });
    setJoining(false);
    if (error) { setError(error.message); return; }
    const row = (data as { ok: boolean; reason: string | null }[])?.[0];
    if (!row?.ok) {
      const reasons = g.reasons as Record<string, string>;
      setError(reasons[row?.reason ?? ""] ?? g.invalid_default);
      return;
    }
    router.push("/");
  }

  const roleLabel = info?.role === "admin" ? g.role_admin : g.role_guests;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-violet-950">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-500/10" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-pink-200/40 blur-3xl dark:bg-pink-500/10" />

      <div className="relative w-full max-w-sm mx-4">
        <div className="rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-white/5 shadow-2xl shadow-violet-900/5 p-8 text-center">
          {!info && !error && (
            <p className="text-sm text-zinc-400 py-8">{t.loading}</p>
          )}

          {info && info.valid && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {g.join_title(info.group_name ?? "")}
              </h1>
              {info.group_description && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {info.group_description}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-400">
                {g.as_role(roleLabel)}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {g.join_subtitle}
              </p>

              {!authChecked ? (
                <p className="mt-8 text-xs text-zinc-400">{t.loading}</p>
              ) : authed ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="mt-8 w-full h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
                >
                  <Users className="h-4 w-4" />
                  {joining ? g.joining : g.join_button}
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="mt-8 w-full h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition"
                >
                  <Calendar className="h-4 w-4" />
                  {g.join_login}
                </button>
              )}
            </>
          )}

          {info && !info.valid && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">⚠️</div>
              </div>
              <h1 className="text-lg font-semibold tracking-tight">{g.invalid_title}</h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {(g.reasons as Record<string, string>)[info.reason ?? ""] ?? g.invalid_default}
              </p>
            </>
          )}

          {error && (
            <p className="mt-4 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
