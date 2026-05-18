import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getStoredLocale, getStoredOutputMode, setStoredLocale, setStoredOutputMode, translate, type AiOutputMode } from "./localeStorage";
import type { AppLocale } from "./messages";

type I18nValue = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  outputMode: AiOutputMode;
  setOutputMode: (m: AiOutputMode) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => getStoredLocale());
  const [outputMode, setOutputModeState] = useState<AiOutputMode>(() => getStoredOutputMode());

  const setLocale = useCallback((l: AppLocale) => {
    setStoredLocale(l);
    setLocaleState(l);
  }, []);

  const setOutputMode = useCallback((m: AiOutputMode) => {
    setStoredOutputMode(m);
    setOutputModeState(m);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string>) => translate(locale, key, vars), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, outputMode, setOutputMode, t }),
    [locale, outputMode, setLocale, setOutputMode, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
