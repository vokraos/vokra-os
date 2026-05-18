import { HERO_TEST_RESULTS_MEMORY_SCHEMA, type HeroTestResultsMemoryPayload } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseHeroTestResultsMemoryPayload(raw: string): HeroTestResultsMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!isRecord(o) || o.schema !== HERO_TEST_RESULTS_MEMORY_SCHEMA || !isRecord(o.bundle)) return null;
    if (typeof (o.bundle as { sourceMatrixId?: unknown }).sourceMatrixId !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return {
      schema: HERO_TEST_RESULTS_MEMORY_SCHEMA,
      savedAt,
      bundle: o.bundle as HeroTestResultsMemoryPayload["bundle"],
      matrix: (o.matrix as HeroTestResultsMemoryPayload["matrix"]) ?? undefined,
      serpEnvelope: (o.serpEnvelope as HeroTestResultsMemoryPayload["serpEnvelope"]) ?? undefined,
    };
  } catch {
    return null;
  }
}

export function buildHeroTestResultsMemoryPayload(
  bundle: HeroTestResultsMemoryPayload["bundle"],
  matrix: HeroTestResultsMemoryPayload["matrix"],
  serpEnvelope: HeroTestResultsMemoryPayload["serpEnvelope"],
): HeroTestResultsMemoryPayload {
  return {
    schema: HERO_TEST_RESULTS_MEMORY_SCHEMA,
    savedAt: Date.now(),
    bundle,
    matrix: matrix ?? undefined,
    serpEnvelope: serpEnvelope ?? undefined,
  };
}
