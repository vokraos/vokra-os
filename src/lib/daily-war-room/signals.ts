import { peekDailyWarRoomSession } from "./session";
import type { DailyWarRoomSnapshot } from "./types";

export type WarRoomSignals = {
  snapshot: DailyWarRoomSnapshot;
  savedAt: number;
};

/** Last saved war room snapshot only — never builds a new snapshot. */
export function getWarRoomSignals(): WarRoomSignals | null {
  const payload = peekDailyWarRoomSession();
  if (!payload?.snapshot?.id) return null;
  return { snapshot: payload.snapshot, savedAt: payload.savedAt };
}
