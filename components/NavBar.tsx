"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar } from "./Avatar";
import { NotificationBell } from "./NotificationBell";
import { useT } from "@/lib/i18n";

type Props = {
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  onSignOut: () => void;
};

export function NavBar({ username, fullName, avatarUrl, onSignOut }: Props) {
  const pathname = usePathname();
  const { t, lang, setLang } = useT();

  const NAV_ITEMS = [
    { href: "/", label: t("nav_home") },
    { href: "/create", label: t("nav_create") },
    { href: "/contacts", label: t("nav_contacts") },
  ];

  return (
    <header className="bg-[#faf6ef]/90 backdrop-blur-md border-b border-stone-200/60 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        <Link
          href="/"
          className="font-bold text-stone-900 tracking-tight text-xl shrink-0 select-none"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Agenddi<span className="text-[#c2410c]">.</span>
        </Link>

        <nav className="flex items-center gap-5">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium pb-0.5 border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "border-[#c2410c] text-[#c2410c]"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="text-[10px] font-bold tracking-wider text-stone-500 hover:text-[#c2410c] transition-colors px-1.5 py-1 rounded cursor-pointer"
            aria-label="Language"
            title={lang === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
          >
            {lang.toUpperCase()}
          </button>
          <NotificationBell />
          {username && (
            <Link href={`/u/${username}`} aria-label={`@${username}`} title={`@${username}`}>
              <Avatar src={avatarUrl} name={fullName} size="sm" />
            </Link>
          )}
          <button
            onClick={onSignOut}
            aria-label={t("nav_logout")}
            title={t("nav_logout")}
            className="h-8 w-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
