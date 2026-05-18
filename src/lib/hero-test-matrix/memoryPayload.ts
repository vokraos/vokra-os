import { HERO_TEST_MATRIX_MEMORY_SCHEMA, type HeroTestMatrixMemoryPayload } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseHeroTestMatrixMemoryPayload(raw: string): HeroTestMatrixMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!isRecord(o) || o.schema !== HERO_TEST_MATRIX_MEMORY_SCHEMA || !isRecord(o.matrix)) return null;
    if (typeof (o.matrix as { id?: unknown }).id !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return {
      schema: HERO_TEST_MATRIX_MEMORY_SCHEMA,
      savedAt,
      matrix: o.matrix as HeroTestMatrixMemoryPayload["matrix"],
      serpEnvelope: (o.serpEnvelope as HeroTestMatrixMemoryPayload["serpEnvelope"]) ?? undefined,
      battlePlanId: typeof o.battlePlanId === "string" ? o.battlePlanId : undefined,
    };
  } catch {
    return null;
  }
}

export function buildHeroTestMatrixMemoryPayload(
  matrix: HeroTestMatrixMemoryPayload["matrix"],
  serpEnvelope: HeroTestMatrixMemoryPayload["serpEnvelope"],
  battlePlanId?: string,
): HeroTestMatrixMemoryPayload {
  return {
    schema: HERO_TEST_MATRIX_MEMORY_SCHEMA,
    savedAt: Date.now(),
    matrix,
    serpEnvelope: serpEnvelope ?? undefined,
    battlePlanId,
  };
}
