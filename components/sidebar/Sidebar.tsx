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

type Item = { id: string; name: string; avatar?: string | null };

const MOCK_FRIENDS: Item[] = [
  { id: "f1", name: "Juan López" },
  { id: "f2", name: "María García" },
  { id: "f3", name: "Sofía Pérez" },
];
const MOCK_GROUPS: Item[] = [
  { id: "g1", name: "Familia" },
  { id: "g2", name: "Trabajo" },
  { id: "g3", name: "Amigos del fútbol" },
];
const MOCK_PLACES: Item[] = [
  { id: "p1", name: "Bar El Toro" },
  { id: "p2", name: "Restó La Plaza" },
];

type Props = {
  selection: SidebarSelection;
  onSelect: (s: SidebarSelection) => void;
  userName?: string;
  userAvatar?: string | null;
};

export function Sidebar({ selection, onSelect, userName, userAvatar }: Props) {
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
          <p className="text-sm font-semibold truncate">{userName ?? "Tú"}</p>
          <p className="text-xs text-zinc-500 truncate">Personal</p>
        </div>
        <SignOutButton />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 scrollbar-hidden">
        <SelfRow
          active={selection.kind === "self"}
          onClick={() => onSelect({ kind: "self" })}
        />

        <Section title="Amigos" icon={<Users className="h-3.5 w-3.5" />}>
          {MOCK_FRIENDS.map((f) => (
            <Row
              key={f.id}
              label={f.name}
              active={selection.kind === "friend" && selection.id === f.id}
              onClick={() =>
                onSelect({ kind: "friend", id: f.id, name: f.name })
              }
              dot="bg-emerald-400"
            />
          ))}
          <AddButton label="Agregar amigo" />
        </Section>

        <Section title="Grupos" icon={<UserCircle className="h-3.5 w-3.5" />}>
          {MOCK_GROUPS.map((g) => (
            <Row
              key={g.id}
              label={g.name}
              active={selection.kind === "group" && selection.id === g.id}
              onClick={() =>
                onSelect({ kind: "group", id: g.id, name: g.name })
              }
              dot="bg-purple-400"
            />
          ))}
          <AddButton label="Crear grupo" />
        </Section>

        <Section title="Lugares" icon={<MapPin className="h-3.5 w-3.5" />}>
          {MOCK_PLACES.map((p) => (
            <Row
              key={p.id}
              label={p.name}
              active={selection.kind === "place" && selection.id === p.id}
              onClick={() =>
                onSelect({ kind: "place", id: p.id, name: p.name })
              }
              dot="bg-orange-400"
            />
          ))}
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

function Row({
  label,
  active,
  onClick,
  dot,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
        active
          ? "bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white font-medium"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5"
      )}
    >
      {dot && <span className={cn("h-2 w-2 rounded-full", dot)} />}
      <span className="truncate">{label}</span>
    </button>
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
