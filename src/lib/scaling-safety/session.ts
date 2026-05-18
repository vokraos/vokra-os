import type { ScalingSafetyMemoryPayload } from "./types";

const SSF_SESSION_KEY = "vokra.scalingSafety.state" as const;

export function saveScalingSafetySession(payload: ScalingSafetyMemoryPayload): void {
  try {
    sessionStorage.setItem(SSF_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekScalingSafetySession(): ScalingSafetyMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(SSF_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as ScalingSafetyMemoryPayload;
    return o?.report ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromScalingSafetyMemoryPayload(payload: ScalingSafetyMemoryPayload): void {
  saveScalingSafetySession(payload);
}
