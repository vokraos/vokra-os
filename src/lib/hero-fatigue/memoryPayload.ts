import { HERO_FATIGUE_INTELLIGENCE_MEMORY_SCHEMA, type HeroFatigueIntelligenceMemoryPayload } from "./types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseHeroFatigueIntelligenceMemoryPayload(raw: string): HeroFatigueIntelligenceMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o)) return null;
    if (o.schema !== HERO_FATIGUE_INTELLIGENCE_MEMORY_SCHEMA) return null;
    if (!isRecord(o.report) || typeof (o.report as { id?: unknown }).id !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return { ...(o as unknown as HeroFatigueIntelligenceMemoryPayload), savedAt };
  } catch {
    return null;
  }
}

export function buildHeroFatigueIntelligenceMemoryPayload(
  report: HeroFatigueIntelligenceMemoryPayload["report"],
  serpEnvelope: HeroFatigueIntelligenceMemoryPayload["serpEnvelope"],
): HeroFatigueIntelligenceMemoryPayload {
  return {
    schema: HERO_FATIGUE_INTELLIGENCE_MEMORY_SCHEMA,
    savedAt: Date.now(),
    report,
    serpEnvelope: serpEnvelope ?? undefined,
  };
}
