import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "zh" | "en";
export const LANGUAGE_STORAGE_KEY = "grant-studio-language";

export function resolveLanguage(search: string, stored: string | null): Language {
  const requested = new URLSearchParams(search).get("lang");
  if (requested === "zh" || requested === "en") return requested;
  return stored === "en" ? "en" : "zh";
}

export function localizedHref(path: string, language: Language): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const url = new URL(path, "https://zhzhg-dev.github.io");
  url.searchParams.set("lang", language);
  return `${url.pathname}${url.search}${url.hash}`;
}

function initialLanguage(): Language {
  if (typeof window === "undefined") return "zh";
  let stored: string | null = null;
  try { stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { /* Storage is optional. */ }
  return resolveLanguage(window.location.search, stored);
}

type LanguageValue = {
  language: Language;
  t: (english: string, chinese: string) => string;
  href: (path: string) => string;
  setLanguage: (language: Language) => void;
};

// Isolated components keep their original English rendering. The actual site
// always mounts the provider, whose first-visit language is Chinese.
export const LanguageContext = createContext<LanguageValue>({
  language: "en", t: english => english, href: path => path, setLanguage: () => {},
});

function syncAddress(language: Language) {
  const address = new URL(window.location.href);
  address.searchParams.set("lang", language);
  window.history.replaceState(window.history.state, "", `${address.pathname}${address.search}${address.hash}`);
}

export function LanguageProvider({ children, initialLanguage: suppliedLanguage }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setValue] = useState<Language>(() => suppliedLanguage ?? initialLanguage());
  const setLanguage = useCallback((next: Language) => {
    setValue(next);
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* Query links work without storage. */ }
    syncAddress(next);
  }, []);
  const t = useCallback((english: string, chinese: string) => language === "zh" ? chinese : english, [language]);
  const href = useCallback((path: string) => localizedHref(path, language), [language]);
  const value = useMemo(() => ({ language, t, href, setLanguage }), [language, t, href, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    // Case-study history navigation must not undo a deliberate language choice.
    const preserveLanguage = () => syncAddress(language);
    window.addEventListener("popstate", preserveLanguage);
    return () => window.removeEventListener("popstate", preserveLanguage);
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
