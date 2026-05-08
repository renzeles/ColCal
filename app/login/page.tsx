"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "oauth" | "signin" | "signup";

function LoginContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("oauth");
  const [loading, setLoading] = useState<"google" | "azure" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (searchParams.get("error")) {
      setError("Hubo un problema al iniciar sesión. Intentá de nuevo.");
    }
  }, [searchParams]);

  async function signInOAuth(provider: "google" | "azure") {
    setLoading(provider);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) throw authError;
    } catch {
      setError("No se pudo conectar. Revisá tu conexión e intentá de nuevo.");
      setLoading(null);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    setInfo(null);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.href = "/";
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || null },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (err) throw err;
        if (data.session) {
          window.location.href = "/";
        } else {
          setInfo("Te mandamos un email de confirmación. Confirmá tu cuenta para entrar.");
          setLoading(null);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Agendi</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Crea, comparte y recibí eventos.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg p-6">
          {error && (
            <div role="alert" className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-sm text-center">
              {info}
            </div>
          )}

          {mode === "oauth" ? (
            <div className="space-y-3">
              <button
                onClick={() => signInOAuth("google")}
                disabled={loading !== null}
                className="w-full h-12 rounded-lg bg-white border border-zinc-300 text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-50 disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading === "google" ? "Conectando…" : "Continuar con Google"}
              </button>

              <button
                onClick={() => signInOAuth("azure")}
                disabled={loading !== null}
                className="w-full h-12 rounded-lg bg-white border border-zinc-300 text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-50 disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                {loading === "azure" ? "Conectando…" : "Continuar con Microsoft"}
              </button>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="text-xs text-zinc-400">o</span>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>

              <button
                onClick={() => { setMode("signin"); setError(null); }}
                className="w-full h-11 rounded-lg bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition"
              >
                Entrar con email y contraseña
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === "signup" && (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nombre (opcional)"
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={loading !== null}
                className="w-full h-11 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading === "email" ? "Cargando…" : mode === "signin" ? "Entrar" : "Crear cuenta"}
              </button>

              <button
                type="button"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
                className="w-full text-xs text-zinc-500 hover:text-zinc-900 transition"
              >
                {mode === "signin" ? "¿No tenés cuenta? Crear una" : "¿Ya tenés cuenta? Entrar"}
              </button>

              <button
                type="button"
                onClick={() => { setMode("oauth"); setError(null); setInfo(null); }}
                className="w-full text-xs text-zinc-400 hover:text-zinc-700 transition"
              >
                ← Volver a otras opciones
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
