import type { HeroPromptArchetype } from "../prompt-composer/types";
import type { CompetitorSerpEnvelope } from "../competitor-serp/types";

export const HERO_IMPROVEMENT_PLAN_MEMORY_SCHEMA = "vokra.heroImprovementPlan.v1" as const;

/** Derived only from manual SERP + OS heuristics — no CTR, no scraping. */
export type CompetitiveHeroImprovementPlan = {
  id: string;
  sourceSerpSnapshotId: string;
  query: string;
  marketplace: string;
  corridor: string;
  createdAt: number;
  competitorSummary: string;
  visualWeaknesses: string[];
  differentiationOpportunity: string;
  recommendedHeroDirection: string;
  marketplaceConstraints: string[];
  promptDirection: string;
  negativeConstraints: string;
  riskFlags: string[];
  expectedEffect: string;
  nextActions: string[];
  suggestedHeroArch: HeroPromptArchetype;
};

export type HeroImprovementPlanMemoryPayload = {
  schema: typeof HERO_IMPROVEMENT_PLAN_MEMORY_SCHEMA;
  savedAt: number;
  plan: CompetitiveHeroImprovementPlan;
  /** Optional: restores SERP block in Competitive Map on reopen */
  serpEnvelope?: CompetitorSerpEnvelope | null;
};
