"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Language, Direction, TranslationSchema, SUPPORTED_LANGUAGES, LanguageInfo } from "./types";
import { fr } from "./translations/fr";
import { en } from "./translations/en";
import { ar } from "./translations/ar";

const DICTIONARIES: Record<Language, TranslationSchema> = {
  fr,
  en,
  ar,
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: Direction;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "passpro_lang";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("fr");
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage on client
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && (saved === "fr" || saved === "en" || saved === "ar")) {
        setLanguageState(saved);
        applyDocumentAttributes(saved);
      } else {
        applyDocumentAttributes("fr");
      }
    } catch {
      applyDocumentAttributes("fr");
    }
  }, []);

  const applyDocumentAttributes = (lang: Language) => {
    if (typeof document === "undefined") return;
    const isArabic = lang === "ar";
    const dir: Direction = isArabic ? "rtl" : "ltr";

    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.setAttribute("data-lang", lang);

    if (isArabic) {
      document.documentElement.classList.add("lang-ar");
      document.body.classList.add("lang-ar");
    } else {
      document.documentElement.classList.remove("lang-ar");
      document.body.classList.remove("lang-ar");
    }
  };

  const setLanguage = (newLang: Language) => {
    if (newLang !== "fr" && newLang !== "en" && newLang !== "ar") return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
    applyDocumentAttributes(newLang);

    // Broadcast custom event so any non-react listeners can react if needed
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("passpro-lang-change", { detail: { language: newLang } }));
    }
  };

  const isRTL = language === "ar";
  const dir: Direction = isRTL ? "rtl" : "ltr";

  const currentLanguageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      const dict = DICTIONARIES[language] || DICTIONARIES.fr;
      const parts = key.split(".");

      let current: any = dict;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          // Fallback to French if missing
          let fallbackCurrent: any = DICTIONARIES.fr;
          for (const fallbackPart of parts) {
            if (fallbackCurrent && typeof fallbackCurrent === "object" && fallbackPart in fallbackCurrent) {
              fallbackCurrent = fallbackCurrent[fallbackPart];
            } else {
              fallbackCurrent = undefined;
              break;
            }
          }
          current = fallbackCurrent !== undefined ? fallbackCurrent : key;
          break;
        }
      }

      if (typeof current !== "string") {
        return key;
      }

      let result = current;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
        });
      }

      return result;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      dir,
      isRTL,
      t,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageInfo,
    }),
    [language, dir, isRTL, t, currentLanguageInfo]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      language: "fr",
      setLanguage: () => {},
      dir: "ltr",
      isRTL: false,
      t: (key: string) => key,
      languages: SUPPORTED_LANGUAGES,
      currentLanguageInfo: SUPPORTED_LANGUAGES[0],
    };
  }
  return ctx;
};

export const useLanguage = useTranslation;
