import {
  CORRIDOR_STRATEGY_MEMORY_SCHEMA,
  type CorridorStrategyMemoryPayload,
  type CorridorStrategyReport,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseCorridorStrategyMemoryPayload(raw: string): CorridorStrategyMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== CORRIDOR_STRATEGY_MEMORY_SCHEMA) return null;
    const reports = Array.isArray(o.reports) ? (o.reports as CorridorStrategyReport[]) : [];
    if (!reports.length) return null;
    return {
      schema: CORRIDOR_STRATEGY_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      reports,
      strategies: Array.isArray(o.strategies) ? (o.strategies as string[]) : undefined,
      moves: Array.isArray(o.moves) ? (o.moves as string[]) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildCorridorStrategyMemoryPayload(
  reports: CorridorStrategyReport[],
  extras?: Pick<CorridorStrategyMemoryPayload, "strategies" | "moves">,
): CorridorStrategyMemoryPayload {
  return {
    schema: CORRIDOR_STRATEGY_MEMORY_SCHEMA,
    savedAt: Date.now(),
    reports,
    strategies: extras?.strategies ?? reports.map((r) => r.recommendedStrategy),
    moves: extras?.moves,
  };
}
