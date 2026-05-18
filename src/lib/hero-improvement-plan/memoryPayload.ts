import { HERO_IMPROVEMENT_PLAN_MEMORY_SCHEMA, type HeroImprovementPlanMemoryPayload } from "./types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseHeroImprovementPlanMemoryPayload(raw: string): HeroImprovementPlanMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o)) return null;
    if (o.schema !== HERO_IMPROVEMENT_PLAN_MEMORY_SCHEMA) return null;
    if (!isRecord(o.plan)) return null;
    if (typeof (o.plan as { id?: unknown }).id !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return { ...(o as unknown as HeroImprovementPlanMemoryPayload), savedAt };
  } catch {
    return null;
  }
}

export function buildHeroImprovementPlanMemoryPayload(
  plan: HeroImprovementPlanMemoryPayload["plan"],
  serpEnvelope: HeroImprovementPlanMemoryPayload["serpEnvelope"],
): HeroImprovementPlanMemoryPayload {
  return {
    schema: HERO_IMPROVEMENT_PLAN_MEMORY_SCHEMA,
    savedAt: Date.now(),
    plan,
    serpEnvelope: serpEnvelope ?? undefined,
  };
}
