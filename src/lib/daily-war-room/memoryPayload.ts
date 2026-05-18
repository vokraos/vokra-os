import { DAILY_WAR_ROOM_MEMORY_SCHEMA, type DailyWarRoomMemoryPayload, type DailyWarRoomSnapshot } from "./types";

export function buildDailyWarRoomMemoryPayload(snapshot: DailyWarRoomSnapshot): DailyWarRoomMemoryPayload {
  return {
    schema: DAILY_WAR_ROOM_MEMORY_SCHEMA,
    savedAt: Date.now(),
    snapshot,
  };
}

export function parseDailyWarRoomMemoryPayload(raw: string): DailyWarRoomMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null) return null;
    const p = o as DailyWarRoomMemoryPayload;
    if (p.schema !== DAILY_WAR_ROOM_MEMORY_SCHEMA || !p.snapshot?.id) return null;
    return {
      schema: DAILY_WAR_ROOM_MEMORY_SCHEMA,
      savedAt: typeof p.savedAt === "number" ? p.savedAt : Date.now(),
      snapshot: p.snapshot,
    };
  } catch {
    return null;
  }
}
