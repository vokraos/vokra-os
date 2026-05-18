import {
  COMPETITIVE_MAP_MEMORY_SCHEMA,
  type CompetitiveMapFoundation,
  type CompetitiveMapMemoryPayload,
} from "./types";

const SESSION_KEY = "vokra.competitiveMap.memory";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseCompetitiveMapMemoryPayload(raw: string): CompetitiveMapMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o)) return null;
    if (o.schema !== COMPETITIVE_MAP_MEMORY_SCHEMA) return null;
    if (!isRecord(o.foundation)) return null;
    const f = o.foundation as Partial<CompetitiveMapFoundation>;
    if (!Array.isArray(f.clusters) || !Array.isArray(f.competitorCorridors)) return null;
    return o as CompetitiveMapMemoryPayload;
  } catch {
    return null;
  }
}

export function buildCompetitiveMapMemoryPayload(foundation: CompetitiveMapFoundation): CompetitiveMapMemoryPayload {
  return {
    schema: COMPETITIVE_MAP_MEMORY_SCHEMA,
    sourceSnapshotId: foundation.sourceSnapshotId,
    savedAt: Date.now(),
    foundation,
  };
}

export function saveCompetitiveMapMemoryToSession(payload: CompetitiveMapMemoryPayload): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function consumeCompetitiveMapMemoryFromSession(): CompetitiveMapMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_KEY);
    return parseCompetitiveMapMemoryPayload(raw);
  } catch {
    return null;
  }
}
