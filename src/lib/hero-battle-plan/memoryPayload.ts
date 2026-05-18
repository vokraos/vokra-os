import { HERO_BATTLE_PLAN_MEMORY_SCHEMA, type HeroBattlePlanMemoryPayload } from "./types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseHeroBattlePlanMemoryPayload(raw: string): HeroBattlePlanMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o)) return null;
    if (o.schema !== HERO_BATTLE_PLAN_MEMORY_SCHEMA) return null;
    if (!isRecord(o.plan) || typeof (o.plan as { id?: unknown }).id !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return {
      schema: HERO_BATTLE_PLAN_MEMORY_SCHEMA,
      savedAt,
      plan: o.plan as HeroBattlePlanMemoryPayload["plan"],
      serpEnvelope: (o.serpEnvelope as HeroBattlePlanMemoryPayload["serpEnvelope"]) ?? undefined,
    };
  } catch {
    return null;
  }
}

export function buildHeroBattlePlanMemoryPayload(
  plan: HeroBattlePlanMemoryPayload["plan"],
  serpEnvelope: HeroBattlePlanMemoryPayload["serpEnvelope"],
): HeroBattlePlanMemoryPayload {
  return {
    schema: HERO_BATTLE_PLAN_MEMORY_SCHEMA,
    savedAt: Date.now(),
    plan,
    serpEnvelope: serpEnvelope ?? undefined,
  };
}
