"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (group: { id: string; name: string }) => void;
};

type Step = "form" | "invite";

export function CreateGroupModal({ open, onClose, onCreated }: Props) {
  const { t } = useT();
  const g = t.group;

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");

  const [role, setRole] = useState<"guests" | "admin">("guests");
  const [link, setLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("form");
      setName("");
      setDescription("");
      setGroupId(null);
      setLink(null);
      setCopied(false);
      setError(null);
    }
  }, [open]);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setError("No autenticado"); setCreating(false); return; }

    const { data: group, error: gErr } = await supabase
      .from("groups")
      .insert({ name: name.trim(), description: description.trim() || null, created_by: auth.user.id })
      .select("id, name")
      .single();
    if (gErr) { setError(gErr.message); setCreating(false); return; }

    await supabase.from("group_members").insert({ group_id: group.id, user_id: auth.user.id, role: "admin" });

    setCreating(false);
    setGroupId(group.id);
    setGroupName(group.name);
    onCreated?.(group);
    setStep("invite");
  }

  async function handleGenerate() {
    if (!groupId) return;
    setGenerating(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setError("No autenticado"); setGenerating(false); return; }

    const { data, error: invErr } = await supabase
      .from("group_invites")
      .insert({ group_id: groupId, invited_by: auth.user.id, role })
      .select("id")
      .single();
    setGenerating(false);
    if (invErr) { setError(invErr.message); return; }
    setLink(`${window.location.origin}/group-invite/${data.id}`);
    setCopied(false);
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
          <h2 className="text-base font-semibold tracking-tight">
            {step === "form" ? g.create_title : g.invite_title}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-6 space-y-4">
          {step === "form" ? (
            <>
              <div className="flex justify-center py-2">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>

              <FormField label={g.name_label}>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder={g.name_placeholder}
                  className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-zinc-400"
                />
              </FormField>

              <FormField label={g.desc_label}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={g.desc_placeholder}
                  rows={2}
                  className="w-full bg-transparent border-0 outline-none text-sm resize-none placeholder:text-zinc-400"
                />
              </FormField>

              <button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="w-full h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
              >
                {creating ? g.creating : g.create_button}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 text-center">
                <span className="font-semibold">{groupName}</span>
              </p>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  {g.role_label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <RoleCard
                    active={role === "guests"}
                    onClick={() => { setRole("guests"); setLink(null); }}
                    label={g.role_guests}
                    hint={g.role_guests_hint}
                  />
                  <RoleCard
                    active={role === "admin"}
                    onClick={() => { setRole("admin"); setLink(null); }}
                    label={g.role_admin}
                    hint={g.role_admin_hint}
                  />
                </div>
              </div>

              {!link ? (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full h-11 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
                >
                  {generating ? g.generating : g.generate_link}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5">
                    <input
                      readOnly
                      value={link}
                      className="w-full bg-transparent border-0 outline-none text-xs font-mono truncate text-zinc-600 dark:text-zinc-300"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                  <button
                    onClick={copy}
                    className={`w-full h-11 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] ${
                      copied ? "bg-emerald-500 text-white" : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    }`}
                  >
                    {copied ? <><Check className="h-4 w-4" />{g.copied}</> : <><Copy className="h-4 w-4" />{g.copy}</>}
                  </button>
                  <p className="text-[11px] text-center text-zinc-400">{g.expires}</p>
                  <button
                    onClick={() => { setLink(null); setRole("guests"); }}
                    className="w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition text-center"
                  >
                    {g.generate_link} ({role === "guests" ? g.role_admin : g.role_guests})
                  </button>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">{label}</p>
      {children}
    </div>
  );
}

function RoleCard({ active, onClick, label, hint }: { active: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl border text-left transition",
        active
          ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-600"
      )}
    >
      <p className={cn("text-sm font-semibold", active ? "text-blue-600 dark:text-blue-400" : "text-zinc-800 dark:text-zinc-200")}>
        {label}
      </p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{hint}</p>
    </button>
  );
}
