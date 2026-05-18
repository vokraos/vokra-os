import {
  CONTROL_TOWER_MEMORY_SCHEMA,
  type ControlTowerMemoryPayload,
  type StrategicControlTowerSnapshot,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseControlTowerMemoryPayload(raw: string): ControlTowerMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== CONTROL_TOWER_MEMORY_SCHEMA) return null;
    const snapshot = o.snapshot as StrategicControlTowerSnapshot | undefined;
    if (!snapshot?.id || !snapshot.tiles?.length) return null;
    return {
      schema: CONTROL_TOWER_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      snapshot,
      systemStates: Array.isArray(o.systemStates) ? (o.systemStates as string[]) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildControlTowerMemoryPayload(
  snapshot: StrategicControlTowerSnapshot,
): ControlTowerMemoryPayload {
  return {
    schema: CONTROL_TOWER_MEMORY_SCHEMA,
    savedAt: Date.now(),
    snapshot,
    systemStates: snapshot.tiles.map((tile) => `${tile.id}:${tile.health}`),
  };
}
