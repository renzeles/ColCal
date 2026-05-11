"use client";

import Link from "next/link";
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
  const { lang, setLang, t } = useT();

  return (
    <header className="bg-[#f5efe2]/95 backdrop-blur-md border-b border-[#8b5a3c]/15 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        <Link
          href="/"
          className="font-extrabold text-[#2a1f17] tracking-tight text-2xl shrink-0 select-none"
        >
          Agenddi<span className="text-[#9a3c2b]">.</span>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="text-[10px] font-bold tracking-wider text-[#8b5a3c]/70 hover:text-[#8b5a3c] transition-colors px-1.5 py-1 rounded cursor-pointer"
            aria-label="Language"
            title={lang === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
          >
            {lang.toUpperCase()}
          </button>
          <NotificationBell />
          {username && (
            <Link href="/profile" aria-label="Profile" title="Profile">
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
