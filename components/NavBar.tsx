"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, LogOut, Users } from "lucide-react";
import { Avatar } from "./Avatar";
import { NotificationBell } from "./NotificationBell";

type Props = {
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  onSignOut: () => void;
};

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/create", label: "Crear" },
  { href: "/contacts", label: "Contactos" },
];

export function NavBar({ username, fullName, avatarUrl, onSignOut }: Props) {
  const pathname = usePathname();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-stone-100 sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link href="/" className="font-semibold text-stone-900 tracking-tight text-base shrink-0 select-none">
          Agenddi
        </Link>

        {/* Nav links — underline style */}
        <nav className="flex items-center gap-5">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium pb-0.5 border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "border-teal-700 text-teal-700"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <NotificationBell />
          {username && (
            <Link href={`/u/${username}`} aria-label="Mi perfil" title={`@${username}`}>
              <Avatar src={avatarUrl} name={fullName} size="sm" />
            </Link>
          )}
          <button
            onClick={onSignOut}
            aria-label="Salir"
            title="Salir"
            className="h-8 w-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
