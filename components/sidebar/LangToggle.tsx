"use client";

import { useT } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <button
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      title={lang === "es" ? "Switch to English" : "Cambiar a español"}
      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-semibold tracking-wide leading-none"
    >
      {lang === "es" ? "EN" : "ES"}
    </button>
  );
}
