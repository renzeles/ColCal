"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const { t, lang, setLang } = useT();
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-pink-200/40 blur-3xl dark:bg-pink-500/10" />

      <button
        onClick={() => setLang(lang === "es" ? "en" : "es")}
        className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-white/60 dark:bg-zinc-800/60 border border-black/5 dark:border-white/10 backdrop-blur-sm transition"
      >
        {lang === "es" ? "EN" : "ES"}
      </button>

      <div className="relative w-full max-w-sm mx-4">
        <div className="rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-white/5 shadow-2xl shadow-blue-900/5 p-10">
          <div className="flex justify-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Calendar className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-center text-zinc-900 dark:text-white tracking-tight">
            {t.login.title}
          </h1>
          <p className="mt-2 text-sm text-center text-zinc-500 dark:text-zinc-400">
            {t.login.subtitle}
          </p>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-8 w-full h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            <GoogleIcon />
            {loading ? t.login.connecting : t.login.button}
          </button>

          <p className="mt-6 text-xs text-center text-zinc-400 dark:text-zinc-500">
            {t.login.terms}
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 5.04c1.96 0 3.72.67 5.1 1.99l3.81-3.81C18.6 1.18 15.6 0 12 0 7.32 0 3.27 2.7 1.28 6.62l4.45 3.45C6.7 7.1 9.12 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.45c-.28 1.5-1.13 2.77-2.4 3.62l3.7 2.87c2.16-2 3.4-4.95 3.4-8.67z"
      />
      <path
        fill="#FBBC05"
        d="M5.73 14.07a7.2 7.2 0 0 1 0-4.59L1.28 6.03a12 12 0 0 0 0 11.94l4.45-3.9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.7-2.87c-1.03.7-2.34 1.1-4.25 1.1-2.88 0-5.3-2.06-6.27-4.93l-4.45 3.9C3.27 21.3 7.32 24 12 24z"
      />
    </svg>
  );
}
