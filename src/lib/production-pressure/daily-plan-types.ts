import type { ProductionState } from "./types";

export type ProductionDailyPlan = {
  id: string;
  createdAt: number;
  sourceReportId: string;
  activeScenario: string | null;
  requiredScenario: string | null;
  productionState: ProductionState;
  todayFocus: string;
  todayFocusVars: Record<string, string>;
  doFirst: string[];
  delay: string[];
  avoid: string[];
  bottleneckWatch: string[];
  capacityNotes: string[];
  reportBackQuestions: string[];
  confidenceNote: string;
};

export const PRODUCTION_DAILY_PLAN_MEMORY_SCHEMA = "vokra.productionDailyPlan.v1" as const;

export type ProductionDailyPlanMemoryPayload = {
  schema: typeof PRODUCTION_DAILY_PLAN_MEMORY_SCHEMA;
  savedAt: number;
  plan: ProductionDailyPlan;
  report?: unknown;
};
