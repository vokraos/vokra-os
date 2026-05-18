import { EVENING_CLOSE_MEMORY_SCHEMA, type EveningCloseMemoryPayload, type EveningCloseSnapshot } from "./types";

export function buildEveningCloseMemoryPayload(snapshot: EveningCloseSnapshot): EveningCloseMemoryPayload {
  return {
    schema: EVENING_CLOSE_MEMORY_SCHEMA,
    savedAt: Date.now(),
    snapshot,
  };
}

export function parseEveningCloseMemoryPayload(raw: string): EveningCloseMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== "object" || o === null) return null;
    const p = o as EveningCloseMemoryPayload;
    if (p.schema !== EVENING_CLOSE_MEMORY_SCHEMA || !p.snapshot?.id) return null;
    return p;
  } catch {
    return null;
  }
}
