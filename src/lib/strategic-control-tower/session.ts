import type { ControlTowerMemoryPayload } from "./types";

const SCT_SESSION_KEY = "vokra.controlTower.state" as const;

export function saveControlTowerSession(payload: ControlTowerMemoryPayload): void {
  try {
    sessionStorage.setItem(SCT_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekControlTowerSession(): ControlTowerMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(SCT_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as ControlTowerMemoryPayload;
    return o?.snapshot?.id ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromControlTowerMemoryPayload(payload: ControlTowerMemoryPayload): void {
  saveControlTowerSession(payload);
}
