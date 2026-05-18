import { SCALING_SAFETY_MEMORY_SCHEMA, type ScalingSafetyMemoryPayload, type ScalingSafetyReport } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseScalingSafetyMemoryPayload(raw: string): ScalingSafetyMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== SCALING_SAFETY_MEMORY_SCHEMA || !isRecord(o.report)) return null;
    const report = o.report as ScalingSafetyReport;
    if (typeof report.id !== "string") return null;
    return {
      schema: SCALING_SAFETY_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      report,
      supportingSignals: Array.isArray(o.supportingSignals) ? (o.supportingSignals as string[]) : undefined,
      recommendations: Array.isArray(o.recommendations) ? (o.recommendations as string[]) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildScalingSafetyMemoryPayload(
  report: ScalingSafetyReport,
  extras?: Pick<ScalingSafetyMemoryPayload, "supportingSignals" | "recommendations">,
): ScalingSafetyMemoryPayload {
  return {
    schema: SCALING_SAFETY_MEMORY_SCHEMA,
    savedAt: Date.now(),
    report,
    supportingSignals: extras?.supportingSignals ?? report.supportingSignalKeys,
    recommendations: extras?.recommendations ?? [report.recommendedNextStepKey],
  };
}
