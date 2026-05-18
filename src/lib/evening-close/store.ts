import { lsGet, lsSet } from "../storage";
import type { EveningCloseSnapshot } from "./types";

const LAST_CLOSE_KEY = "vokra.eveningClose.last.v1" as const;

export type StoredEveningClose = {
  dateKey: string;
  snapshot: EveningCloseSnapshot;
  savedAt: number;
};

export function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function yesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadLastEveningClose(): StoredEveningClose | null {
  try {
    const raw = lsGet(LAST_CLOSE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as StoredEveningClose;
    if (!o?.snapshot?.id || !o.dateKey) return null;
    return o;
  } catch {
    return null;
  }
}

export function saveLastEveningClose(snapshot: EveningCloseSnapshot): void {
  lsSet(
    LAST_CLOSE_KEY,
    JSON.stringify({
      dateKey: snapshot.dateKey,
      snapshot,
      savedAt: Date.now(),
    } satisfies StoredEveningClose),
  );
}

export function isEveningClosePendingToday(): boolean {
  const last = loadLastEveningClose();
  return !last || last.dateKey !== todayDateKey();
}

/** Evening close from last night — preloads today's morning. */
export function loadEveningCloseForMorning(): EveningCloseSnapshot | null {
  const last = loadLastEveningClose();
  if (!last) return null;
  if (last.dateKey === yesterdayDateKey()) return last.snapshot;
  return null;
}

export function loadTodayEveningCloseSnapshot(): EveningCloseSnapshot | null {
  const last = loadLastEveningClose();
  if (last?.dateKey === todayDateKey()) return last.snapshot;
  return null;
}
