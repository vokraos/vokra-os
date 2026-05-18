import { FBO_FBS_DECISION_MEMORY_SCHEMA, type FboFbsDecisionMemoryPayload, type FboFbsDecisionReport } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseFboFbsDecisionMemoryPayload(raw: string): FboFbsDecisionMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== FBO_FBS_DECISION_MEMORY_SCHEMA || !isRecord(o.report)) return null;
    const report = o.report as FboFbsDecisionReport;
    if (typeof report.id !== "string") return null;
    return {
      schema: FBO_FBS_DECISION_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      report,
      risks: Array.isArray(o.risks) ? (o.risks as string[]) : undefined,
      testWaveSuggestion: typeof o.testWaveSuggestion === "string" ? o.testWaveSuggestion : undefined,
    };
  } catch {
    return null;
  }
}

export function buildFboFbsDecisionMemoryPayload(
  report: FboFbsDecisionReport,
  extras?: Pick<FboFbsDecisionMemoryPayload, "risks" | "testWaveSuggestion">,
): FboFbsDecisionMemoryPayload {
  return {
    schema: FBO_FBS_DECISION_MEMORY_SCHEMA,
    savedAt: Date.now(),
    report,
    risks: extras?.risks,
    testWaveSuggestion: extras?.testWaveSuggestion,
  };
}
