import type { CorridorStrategyMemoryPayload } from "./types";

const CST_SESSION_KEY = "vokra.corridorStrategy.state" as const;

export function saveCorridorStrategySession(payload: CorridorStrategyMemoryPayload): void {
  try {
    sessionStorage.setItem(CST_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekCorridorStrategySession(): CorridorStrategyMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(CST_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as CorridorStrategyMemoryPayload;
    return o?.reports?.length ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromCorridorStrategyMemoryPayload(payload: CorridorStrategyMemoryPayload): void {
  saveCorridorStrategySession(payload);
}
