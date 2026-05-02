"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type InviteInfo = {
  inviter_id: string | null;
  inviter_name: string | null;
  inviter_avatar: string | null;
  valid: boolean;
  reason: string | null;
};

const REASONS: Record<string, string> = {
  not_found: "El link no existe o fue eliminado.",
  used: "Esta invitación ya fue usada.",
  expired: "Esta invitación venció.",
  self: "No podés aceptar tu propio link.",
};

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setAuthed(!!auth.user);
      setAuthChecked(true);

      const { data, error } = await supabase.rpc("get_invite_info", {
        _token: token,
      });
      if (error) {
        setError(error.message);
        return;
      }
      const row = (data as InviteInfo[])?.[0] ?? null;
      setInfo(row);
    })();
  }, [token]);

  async function handleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/invite/${token}`,
      },
    });
  }

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("accept_invite", {
      _token: token,
    });
    setAccepting(false);
    if (error) {
      setError(error.message);
      return;
    }
    const row = (data as { ok: boolean; reason: string | null }[])?.[0];
    if (!row?.ok) {
      setError(REASONS[row?.reason ?? ""] ?? "No se pudo aceptar la invitación.");
      return;
    }
    router.push("/");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-pink-200/40 blur-3xl dark:bg-pink-500/10" />

      <div className="relative w-full max-w-sm mx-4">
        <div className="rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-white/5 shadow-2xl shadow-blue-900/5 p-8 text-center">
          {!info && !error && (
            <p className="text-sm text-zinc-400 py-8">Cargando invitación…</p>
          )}

          {info && info.valid && (
            <>
              <div className="flex justify-center mb-4">
                {info.inviter_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={info.inviter_avatar}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover ring-4 ring-white dark:ring-zinc-800 shadow-lg"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                )}
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {info.inviter_name ?? "Alguien"} te invita a Colcal
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Aceptá para empezar a compartir calendarios y eventos.
              </p>

              {!authChecked ? (
                <p className="mt-8 text-xs text-zinc-400">Cargando…</p>
              ) : authed ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="mt-8 w-full h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  {accepting ? "Aceptando…" : "Aceptar invitación"}
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="mt-8 w-full h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition"
                >
                  <Calendar className="h-4 w-4" />
                  Entrar con Google y aceptar
                </button>
              )}
            </>
          )}

          {info && !info.valid && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">
                  ⚠️
                </div>
              </div>
              <h1 className="text-lg font-semibold tracking-tight">
                Invitación no válida
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {REASONS[info.reason ?? ""] ?? "El link no es válido."}
              </p>
            </>
          )}

          {error && (
            <p className="mt-4 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
