import {
  MARKET_TIMING_MEMORY_SCHEMA,
  type MarketTimingMemoryPayload,
  type MarketTimingReport,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseMarketTimingMemoryPayload(raw: string): MarketTimingMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== MARKET_TIMING_MEMORY_SCHEMA) return null;
    const reports = Array.isArray(o.reports) ? (o.reports as MarketTimingReport[]) : [];
    if (!reports.length) return null;
    return {
      schema: MARKET_TIMING_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      reports,
      cadence: Array.isArray(o.cadence) ? (o.cadence as string[]) : undefined,
      patterns: Array.isArray(o.patterns) ? (o.patterns as string[]) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildMarketTimingMemoryPayload(
  reports: MarketTimingReport[],
  extras?: Pick<MarketTimingMemoryPayload, "cadence" | "patterns">,
): MarketTimingMemoryPayload {
  return {
    schema: MARKET_TIMING_MEMORY_SCHEMA,
    savedAt: Date.now(),
    reports,
    cadence: extras?.cadence ?? reports.map((r) => r.recommendedCadence),
    patterns: extras?.patterns,
  };
}
