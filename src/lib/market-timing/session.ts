import type { MarketTimingMemoryPayload } from "./types";

const MTM_SESSION_KEY = "vokra.marketTiming.state" as const;

export function saveMarketTimingSession(payload: MarketTimingMemoryPayload): void {
  try {
    sessionStorage.setItem(MTM_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekMarketTimingSession(): MarketTimingMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(MTM_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as MarketTimingMemoryPayload;
    return o?.reports?.length ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromMarketTimingMemoryPayload(payload: MarketTimingMemoryPayload): void {
  saveMarketTimingSession(payload);
}
