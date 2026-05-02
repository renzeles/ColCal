"use client";

import { useState } from "react";
import {
  ChevronDown,
  Users,
  MapPin,
  Calendar as CalendarIcon,
  UserCircle,
  Plus,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { SidebarSelection } from "@/lib/types";

type Props = {
  selection: SidebarSelection;
  onSelect: (s: SidebarSelection) => void;
  userName?: string | null;
  userAvatar?: string | null;
  userEmail?: string | null;
};

export function Sidebar({
  selection,
  onSelect,
  userName,
  userAvatar,
  userEmail,
}: Props) {
  return (
    <aside className="w-[260px] shrink-0 h-screen bg-zinc-100/70 dark:bg-zinc-900/40 border-r border-black/5 dark:border-white/5 flex flex-col backdrop-blur-xl">
      <div className="px-4 pt-5 pb-4 flex items-center gap-3">
        {userAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userAvatar}
            alt={userName ?? ""}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {userName ?? "Usuario"}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {userEmail ?? "Personal"}
          </p>
        </div>
        <SignOutButton />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 scrollbar-hidden">
        <SelfRow
          active={selection.kind === "self"}
          onClick={() => onSelect({ kind: "self" })}
        />

        <Section title="Amigos" icon={<Users className="h-3.5 w-3.5" />}>
          <EmptyHint text="Todavía no agregaste amigos" />
          <AddButton label="Agregar amigo" />
        </Section>

        <Section title="Grupos" icon={<UserCircle className="h-3.5 w-3.5" />}>
          <EmptyHint text="Sin grupos" />
          <AddButton label="Crear grupo" />
        </Section>

        <Section title="Lugares" icon={<MapPin className="h-3.5 w-3.5" />}>
          <EmptyHint text="Sin lugares" />
          <AddButton label="Agregar lugar" />
        </Section>
      </nav>
    </aside>
  );
}

function SelfRow({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full mt-2 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white"
          : "text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
      )}
    >
      <CalendarIcon className="h-4 w-4 text-blue-500" />
      Mi calendario
    </button>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            !open && "-rotate-90"
          )}
        />
        {icon}
        {title}
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="px-2.5 py-1 text-xs text-zinc-400 dark:text-zinc-500 italic">
      {text}
    </p>
  );
}

function AddButton({ label }: { label: string }) {
  return (
    <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function SignOutButton() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  return (
    <button
      onClick={signOut}
      title="Cerrar sesión"
      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
