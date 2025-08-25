"use client";

import { createContext, useState, useMemo, type ReactNode } from "react";
import { translations } from "@/lib/translations";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)["fr"]; // or "en", structure is the same
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr");

  const value = useMemo(() => {
    return {
      language,
      setLanguage,
      t: translations[language],
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
