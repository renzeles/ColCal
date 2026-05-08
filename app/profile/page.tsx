"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";
import { NavBar } from "@/components/NavBar";
import { Avatar } from "@/components/Avatar";
import { Toast, useToast } from "@/components/Toast";

export default function ProfilePage() {
  const { user, loading, signOut, updateProfile } = useUser();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setUsername(user.profile.username ?? "");
    setFullName(user.profile.full_name ?? "");
    setDescription(user.profile.description ?? "");
    setAvatarUrl(user.profile.avatar_url ?? "");
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !user) return;
    setSaving(true);
    try {
      const slug = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (slug.length < 3) {
        toast.show("error", "El usuario debe tener al menos 3 letras o números.");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          username: slug,
          full_name: fullName.trim() || null,
          description: description.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("id", user.id);

      if (error) {
        if (error.code === "23505") {
          toast.show("error", "Ese nombre de usuario ya está en uso.");
        } else {
          throw error;
        }
        return;
      }

      updateProfile({
        username: slug,
        full_name: fullName.trim() || null,
        description: description.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      setUsername(slug);
      toast.show("success", "Perfil actualizado");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.show("error", `No se pudo guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  function useOAuthAvatar() {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const url = (data.user?.user_metadata?.avatar_url ?? data.user?.user_metadata?.picture) as
        | string
        | undefined;
      if (url) {
        setAvatarUrl(url);
        toast.show("success", "Avatar restaurado");
      } else {
        toast.show("error", "No hay avatar en tu cuenta de OAuth.");
      }
    });
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Cargando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <NavBar
        username={user.profile.username}
        fullName={user.profile.full_name}
        avatarUrl={user.profile.avatar_url}
        onSignOut={signOut}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6 gap-2">
            <h1 className="text-lg font-semibold text-zinc-900">Tu perfil</h1>
            {user.profile.username && (
              <Link
                href={`/u/${user.profile.username}`}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0"
              >
                <span className="hidden sm:inline">Ver perfil público</span>
                <span className="sm:hidden">Ver perfil</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Avatar src={avatarUrl || null} name={fullName} size="xl" className="self-center sm:self-auto" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="URL del avatar"
                className="px-3 py-1.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs w-full"
              />
              <button
                type="button"
                onClick={useOAuthAvatar}
                className="text-xs text-blue-600 hover:underline self-start"
              >
                Usar foto de mi cuenta de Google/Microsoft
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Nombre de usuario</label>
              <div className="flex items-center">
                <span className="px-3 py-2 rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                  required
                  pattern="[a-zA-Z0-9_]{3,}"
                  className="flex-1 px-3 py-2 rounded-r-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Solo letras, números y _. Mínimo 3 caracteres.
              </p>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contá algo de vos…"
                rows={3}
                maxLength={280}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
              <p className="text-[11px] text-zinc-400 mt-1 text-right">{description.length}/280</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full h-11 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        </section>
      </main>

      <Toast state={toast.state} />
    </div>
  );
}
