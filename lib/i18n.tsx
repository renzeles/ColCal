"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { translations, type Lang, type Translations } from "./translations";

type I18nCtx = {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
};

const I18nContext = createContext<I18nCtx>({
  lang: "es",
  t: translations.es,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const stored = localStorage.getItem("colcal_lang") as Lang | null;
    if (stored === "en" || stored === "es") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("colcal_lang", l);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
