import { lsDel, lsGet, lsSet } from "../storage";

export const WB_API_TOKEN_STORAGE_KEY = "vokra.wb.apiToken" as const;

function envToken(): string {
  try {
    const v = import.meta.env.VITE_WB_API_TOKEN;
    return typeof v === "string" ? v.trim() : "";
  } catch {
    return "";
  }
}

export function getWbApiToken(): string {
  const stored = (lsGet(WB_API_TOKEN_STORAGE_KEY) ?? "").trim();
  if (stored) return stored;
  return envToken();
}

export function setWbApiToken(token: string): void {
  lsSet(WB_API_TOKEN_STORAGE_KEY, token.trim());
}

export function clearWbApiToken(): void {
  lsDel(WB_API_TOKEN_STORAGE_KEY);
}

export function hasWbApiToken(): boolean {
  return getWbApiToken().length > 0;
}
