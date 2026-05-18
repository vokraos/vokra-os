import { HERO_READABILITY_INTELLIGENCE_MEMORY_SCHEMA, type HeroReadabilityIntelligenceMemoryPayload } from "./types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseHeroReadabilityIntelligenceMemoryPayload(raw: string): HeroReadabilityIntelligenceMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o)) return null;
    if (o.schema !== HERO_READABILITY_INTELLIGENCE_MEMORY_SCHEMA) return null;
    if (!isRecord(o.report) || typeof (o.report as { id?: unknown }).id !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return { ...(o as unknown as HeroReadabilityIntelligenceMemoryPayload), savedAt };
  } catch {
    return null;
  }
}

export function buildHeroReadabilityIntelligenceMemoryPayload(
  report: HeroReadabilityIntelligenceMemoryPayload["report"],
  serpEnvelope: HeroReadabilityIntelligenceMemoryPayload["serpEnvelope"],
  gapEcho?: HeroReadabilityIntelligenceMemoryPayload["gapEcho"],
  ourCardEcho?: HeroReadabilityIntelligenceMemoryPayload["ourCardEcho"],
): HeroReadabilityIntelligenceMemoryPayload {
  return {
    schema: HERO_READABILITY_INTELLIGENCE_MEMORY_SCHEMA,
    savedAt: Date.now(),
    report,
    serpEnvelope: serpEnvelope ?? undefined,
    gapEcho: gapEcho ?? undefined,
    ourCardEcho: ourCardEcho ?? undefined,
  };
}
