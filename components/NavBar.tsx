"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarPlus, Users, LogOut } from "lucide-react";
import { Avatar } from "./Avatar";

type Props = {
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  onSignOut: () => void;
};

export function NavBar({ username, fullName, avatarUrl, onSignOut }: Props) {
  const pathname = usePathname();
  const items: { href: string; label: string; icon: typeof Calendar }[] = [
    { href: "/", label: "Eventos", icon: Calendar },
    { href: "/create", label: "Crear", icon: CalendarPlus },
    { href: "/contacts", label: "Contactos", icon: Users },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
        <nav className="flex items-center gap-0.5 sm:gap-1 min-w-0">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {username && (
            <Link
              href={`/u/${username}`}
              className="flex items-center"
              aria-label="Mi perfil"
              title={`Ver perfil público (@${username})`}
            >
              <Avatar src={avatarUrl} name={fullName} size="sm" />
            </Link>
          )}
          <button
            onClick={onSignOut}
            aria-label="Salir"
            title="Salir"
            className="h-8 w-8 sm:h-auto sm:w-auto sm:px-2 flex items-center justify-center rounded-full sm:rounded text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            <LogOut className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
