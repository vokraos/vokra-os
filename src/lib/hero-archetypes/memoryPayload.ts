import { HERO_ARCHETYPE_INTELLIGENCE_MEMORY_SCHEMA, type HeroArchetypeIntelligenceMemoryPayload } from "./types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseHeroArchetypeIntelligenceMemoryPayload(raw: string): HeroArchetypeIntelligenceMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o)) return null;
    if (o.schema !== HERO_ARCHETYPE_INTELLIGENCE_MEMORY_SCHEMA) return null;
    if (!isRecord(o.report) || typeof (o.report as { id?: unknown }).id !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return { ...(o as unknown as HeroArchetypeIntelligenceMemoryPayload), savedAt };
  } catch {
    return null;
  }
}

export function buildHeroArchetypeIntelligenceMemoryPayload(
  report: HeroArchetypeIntelligenceMemoryPayload["report"],
  serpEnvelope: HeroArchetypeIntelligenceMemoryPayload["serpEnvelope"],
): HeroArchetypeIntelligenceMemoryPayload {
  return {
    schema: HERO_ARCHETYPE_INTELLIGENCE_MEMORY_SCHEMA,
    savedAt: Date.now(),
    report,
    serpEnvelope: serpEnvelope ?? undefined,
  };
}
