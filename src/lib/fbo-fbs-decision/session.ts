import type { FboFbsDecisionMemoryPayload } from "./types";

const FFD_SESSION_KEY = "vokra.fboFbsDecision.state" as const;

export function saveFboFbsDecisionSession(payload: FboFbsDecisionMemoryPayload): void {
  try {
    sessionStorage.setItem(FFD_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekFboFbsDecisionSession(): FboFbsDecisionMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(FFD_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as FboFbsDecisionMemoryPayload;
    return o?.report ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromFboFbsDecisionMemoryPayload(payload: FboFbsDecisionMemoryPayload): void {
  saveFboFbsDecisionSession(payload);
}
