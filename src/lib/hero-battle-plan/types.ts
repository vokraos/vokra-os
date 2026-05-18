import type { CompetitorSerpEnvelope } from "../competitor-serp/types";

export const HERO_BATTLE_PLAN_MEMORY_SCHEMA = "vokra.heroBattlePlan.v1" as const;

/** Single consolidated attack plan from manual SERP + derived OS intelligence only. */
export type HeroBattlePlan = {
  id: string;
  query: string;
  marketplace: string;
  createdAt: number;
  sourceSerpSnapshotId: string;
  sourceOurCardSnapshotId: string;
  competitorFieldSummary: string;
  ourHeroDiagnosis: string;
  strongestAdvantage: string;
  biggestWeakness: string;
  recommendedArchetype: string;
  readabilityDirective: string;
  fatigueDirective: string;
  refreshStrategy: string;
  promptDirection: string;
  negativeConstraints: string;
  nextActions: string[];
  riskFlags: string[];
  confidenceNote: string;
};

export type HeroBattlePlanMemoryPayload = {
  schema: typeof HERO_BATTLE_PLAN_MEMORY_SCHEMA;
  savedAt: number;
  plan: HeroBattlePlan;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};
