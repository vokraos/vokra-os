import type { EveningCloseMemoryPayload } from "./types";
import { saveLastEveningClose } from "./store";

const SESSION_KEY = "vokra.eveningClose.lastSession.v1" as const;

export function saveEveningCloseSession(payload: EveningCloseMemoryPayload): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
  saveLastEveningClose(payload.snapshot);
}

export function peekEveningCloseSession(): EveningCloseMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as EveningCloseMemoryPayload;
    return o?.snapshot?.id ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromEveningCloseMemoryPayload(payload: EveningCloseMemoryPayload): void {
  saveEveningCloseSession(payload);
}
