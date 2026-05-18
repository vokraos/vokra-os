import { ECONOMIC_PRESSURE_MEMORY_SCHEMA, type EconomicPressureMemoryPayload } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseEconomicPressureMemoryPayload(raw: string): EconomicPressureMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== ECONOMIC_PRESSURE_MEMORY_SCHEMA || !isRecord(o.report)) return null;
    const report = o.report as EconomicPressureMemoryPayload["report"];
    if (typeof report.id !== "string") return null;
    return {
      schema: ECONOMIC_PRESSURE_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      report,
    };
  } catch {
    return null;
  }
}

export function buildEconomicPressureMemoryPayload(
  report: EconomicPressureMemoryPayload["report"],
  guardrailSummary?: string[],
): EconomicPressureMemoryPayload {
  return {
    schema: ECONOMIC_PRESSURE_MEMORY_SCHEMA,
    savedAt: Date.now(),
    report,
    guardrailSummary,
  };
}
