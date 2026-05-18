import { AD_PRESSURE_MEMORY_SCHEMA, type AdPressureMemoryPayload, type AdvertisingPressureReport } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseReports(arr: unknown): AdvertisingPressureReport[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((r): r is AdvertisingPressureReport => isRecord(r) && typeof r.id === "string");
}

export function parseAdPressureMemoryPayload(raw: string): AdPressureMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== AD_PRESSURE_MEMORY_SCHEMA) return null;
    const reports = parseReports(o.reports);
    if (!reports.length) return null;
    return {
      schema: AD_PRESSURE_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      reports,
      warnings: Array.isArray(o.warnings) ? (o.warnings as string[]) : undefined,
      recommendations: Array.isArray(o.recommendations) ? (o.recommendations as string[]) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildAdPressureMemoryPayload(
  reports: AdvertisingPressureReport[],
  extras?: Pick<AdPressureMemoryPayload, "warnings" | "recommendations">,
): AdPressureMemoryPayload {
  const displayWarnings = extras?.warnings ?? reports.flatMap((r) => r.warningKeys).slice(0, 12);
  const displayRecs =
    extras?.recommendations ?? reports.map((r) => r.recommendedActionKey).filter((k, i, a) => a.indexOf(k) === i).slice(0, 8);
  return {
    schema: AD_PRESSURE_MEMORY_SCHEMA,
    savedAt: Date.now(),
    reports,
    warnings: displayWarnings,
    recommendations: displayRecs,
  };
}
