import type { CompetitorSerpEnvelope } from "../competitor-serp/types";

export type HeroFatigueLevel = "fresh" | "stable" | "aging" | "fatigued" | "exhausted";

export type HeroLifecycleStage = "emerging" | "active" | "saturated" | "declining" | "exhausted" | "refresh_ready";

export type HeroFatigueEntity = {
  id: string;
  fatigueLevel: HeroFatigueLevel;
  repetitionPressure: string;
  archetypeExhaustion: string;
  semanticFatigue: string;
  visualBlindnessRisk: string;
  refreshUrgency: string;
  heroLifecycleStage: HeroLifecycleStage;
  saturationImpact: string;
  refreshOpportunity: string;
  marketplacePressure: string;
  recommendations: string[];
};

export type HeroFatigueIntelligenceReport = {
  id: string;
  sourceSerpSnapshotId: string;
  query: string;
  marketplace: string;
  createdAt: number;
  refreshHistoryHintLine: string;
  dominantFatigueLines: string[];
  saturationPressureLine: string;
  refreshOpportunityLines: string[];
  ourFatigueLines: string[];
  ourFatigueEntity: HeroFatigueEntity | null;
  lifecycleStageLine: string;
  refreshUrgencyLine: string;
  refreshTimingLine: string;
  visualBlindnessRiskLine: string;
  fieldVsOurFatigueLine: string;
  refreshOpportunitySummary: string;
  fatiguePressureIndex: number;
  practicalRecommendations: string[];
};

export const HERO_FATIGUE_INTELLIGENCE_MEMORY_SCHEMA = "vokra.heroFatigueIntelligence.v1" as const;

export type HeroFatigueIntelligenceMemoryPayload = {
  schema: typeof HERO_FATIGUE_INTELLIGENCE_MEMORY_SCHEMA;
  savedAt: number;
  report: HeroFatigueIntelligenceReport;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};
