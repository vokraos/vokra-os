import { lsGet, lsSet } from "../storage";
import { DEFAULT_LOCALE, MESSAGES, type AppLocale } from "./messages";

export const KEY_APP_LOCALE = "vokra.locale";
export const KEY_AI_OUTPUT_MODE = "vokra.ai.outputMode";

export type AiOutputMode = "ru" | "en" | "hybrid";

export function getStoredLocale(): AppLocale {
  const v = lsGet(KEY_APP_LOCALE);
  if (v === "en") return "en";
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale: AppLocale) {
  lsSet(KEY_APP_LOCALE, locale);
}

export function getStoredOutputMode(): AiOutputMode {
  const v = lsGet(KEY_AI_OUTPUT_MODE);
  if (v === "en" || v === "hybrid") return v;
  return "ru";
}

export function setStoredOutputMode(mode: AiOutputMode) {
  lsSet(KEY_AI_OUTPUT_MODE, mode);
}

export function translate(locale: AppLocale, key: string, vars?: Record<string, string>): string {
  const fromLocale = MESSAGES[locale]?.[key];
  let s = fromLocale ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(v);
    }
  }
  return s;
}
