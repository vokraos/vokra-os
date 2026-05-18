import type { DailyWarRoomMemoryPayload } from "./types";

const SESSION_KEY = "vokra.dailyWarRoom.last.v1" as const;

export function saveDailyWarRoomSession(payload: DailyWarRoomMemoryPayload): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekDailyWarRoomSession(): DailyWarRoomMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as DailyWarRoomMemoryPayload;
    return o?.snapshot?.id ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromDailyWarRoomMemoryPayload(payload: DailyWarRoomMemoryPayload): void {
  saveDailyWarRoomSession(payload);
}
