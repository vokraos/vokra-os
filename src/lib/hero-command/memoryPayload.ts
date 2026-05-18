import { HERO_COMMAND_MEMORY_SCHEMA, type HeroCommandMemoryPayload } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseHeroCommandMemoryPayload(raw: string): HeroCommandMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== HERO_COMMAND_MEMORY_SCHEMA || !isRecord(o.snapshot)) return null;
    const snap = o.snapshot as Record<string, unknown>;
    if (typeof snap.id !== "string" || !Array.isArray(snap.stages)) return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return {
      schema: HERO_COMMAND_MEMORY_SCHEMA,
      savedAt,
      snapshot: o.snapshot as HeroCommandMemoryPayload["snapshot"],
      artifacts: (o.artifacts as HeroCommandMemoryPayload["artifacts"]) ?? undefined,
    };
  } catch {
    return null;
  }
}

export function buildHeroCommandMemoryPayload(
  snapshot: HeroCommandMemoryPayload["snapshot"],
  artifacts?: HeroCommandMemoryPayload["artifacts"],
): HeroCommandMemoryPayload {
  return {
    schema: HERO_COMMAND_MEMORY_SCHEMA,
    savedAt: Date.now(),
    snapshot,
    artifacts: artifacts ?? undefined,
  };
}
