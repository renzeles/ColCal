"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, AtSign, Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import { ImageUpload } from "@/components/ui/ImageUpload";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useT();
  const pr = t.profile;
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push("/login"); return; }
      setUserId(auth.user.id);

      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", auth.user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setUsername(data.username ?? "");
        setAvatarUrl(data.avatar_url ?? "");
      } else {
        setFullName(
          (auth.user.user_metadata?.full_name as string) ??
          (auth.user.user_metadata?.name as string) ??
          ""
        );
        setAvatarUrl((auth.user.user_metadata?.avatar_url as string) ?? "");
      }
      setLoading(false);
    })();
  }, [router]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName.trim() || null,
      username: username.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-zinc-400">
        {t.loading}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push("/")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {pr.back}
        </button>

        <div className="rounded-3xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-white/5 shadow-2xl shadow-blue-900/5 overflow-hidden">
          <div className="px-8 py-6 border-b border-black/5 dark:border-white/5">
            <h1 className="text-xl font-semibold tracking-tight">{pr.title}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{pr.subtitle}</p>
          </div>

          <div className="px-8 py-6 space-y-5">
            <div className="flex justify-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-white dark:ring-zinc-800 shadow-lg"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Camera className="h-7 w-7 text-white/70" />
                </div>
              )}
            </div>

            <Field icon={<Camera className="h-4 w-4" />} label={pr.avatar_label}>
              <ImageUpload
                value={avatarUrl}
                onChange={setAvatarUrl}
                bucket="avatars"
                placeholder="https://..."
                previewClass="h-20 w-20 rounded-full overflow-hidden mx-auto"
              />
            </Field>

            <Field icon={<User className="h-4 w-4" />} label={pr.name_label}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={pr.name_label}
                className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-zinc-400"
              />
            </Field>

            <Field icon={<AtSign className="h-4 w-4" />} label={pr.username_label}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={pr.username_label}
                className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-zinc-400"
              />
            </Field>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full h-11 rounded-full font-medium text-sm transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 ${
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              }`}
            >
              {saving ? pr.saving : saved ? pr.saved : pr.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5">
      <div className="text-zinc-400 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}
