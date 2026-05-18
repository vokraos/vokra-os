import { COMPETITIVE_GAP_ANALYSIS_MEMORY_SCHEMA, type CompetitiveGapAnalysisMemoryPayload } from "./types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseCompetitiveGapAnalysisMemoryPayload(raw: string): CompetitiveGapAnalysisMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o)) return null;
    if (o.schema !== COMPETITIVE_GAP_ANALYSIS_MEMORY_SCHEMA) return null;
    if (!isRecord(o.gap) || typeof (o.gap as { id?: unknown }).id !== "string") return null;
    if (!isRecord(o.ourCard) || typeof (o.ourCard as { id?: unknown }).id !== "string") return null;
    const savedAt = typeof o.savedAt === "number" ? o.savedAt : Date.now();
    return { ...(o as unknown as CompetitiveGapAnalysisMemoryPayload), savedAt };
  } catch {
    return null;
  }
}

export function buildCompetitiveGapAnalysisMemoryPayload(
  ourCard: CompetitiveGapAnalysisMemoryPayload["ourCard"],
  gap: CompetitiveGapAnalysisMemoryPayload["gap"],
  serpEnvelope: CompetitiveGapAnalysisMemoryPayload["serpEnvelope"],
): CompetitiveGapAnalysisMemoryPayload {
  return {
    schema: COMPETITIVE_GAP_ANALYSIS_MEMORY_SCHEMA,
    savedAt: Date.now(),
    ourCard,
    gap,
    serpEnvelope: serpEnvelope ?? undefined,
  };
}
