import {
  PRODUCTION_DAILY_PLAN_MEMORY_SCHEMA,
  type ProductionDailyPlan,
  type ProductionDailyPlanMemoryPayload,
} from "./daily-plan-types";
import { parseProductionPressureMemoryPayload } from "./memoryPayload";
import { primeSessionsFromProductionPressureMemoryPayload } from "./session";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function buildProductionDailyPlanMemoryPayload(
  plan: ProductionDailyPlan,
  reportJson?: string,
): ProductionDailyPlanMemoryPayload {
  return {
    schema: PRODUCTION_DAILY_PLAN_MEMORY_SCHEMA,
    savedAt: Date.now(),
    plan,
    report: reportJson ? (JSON.parse(reportJson) as unknown) : undefined,
  };
}

export function parseProductionDailyPlanMemoryPayload(raw: string): ProductionDailyPlanMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== PRODUCTION_DAILY_PLAN_MEMORY_SCHEMA || !isRecord(o.plan)) return null;
    const plan = o.plan as ProductionDailyPlan;
    if (typeof plan.id !== "string" || typeof plan.todayFocus !== "string") return null;
    return {
      schema: PRODUCTION_DAILY_PLAN_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      plan,
      report: o.report,
    };
  } catch {
    return null;
  }
}

/** Restore capacity/shift session from embedded production_pressure payload when present. */
export function primeSessionsFromProductionDailyPlanMemoryPayload(
  payload: ProductionDailyPlanMemoryPayload,
): void {
  if (payload.report && typeof payload.report === "object") {
    const embedded = parseProductionPressureMemoryPayload(JSON.stringify(payload.report));
    if (embedded) {
      primeSessionsFromProductionPressureMemoryPayload(embedded);
      return;
    }
  }
  if (isRecord(payload.report) && "report" in payload.report) {
    const embedded = parseProductionPressureMemoryPayload(JSON.stringify(payload.report));
    if (embedded) primeSessionsFromProductionPressureMemoryPayload(embedded);
  }
}
