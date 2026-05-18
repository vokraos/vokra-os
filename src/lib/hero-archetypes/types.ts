import type { CompetitorSerpEnvelope } from "../competitor-serp/types";

/** Marketplace-facing hero visual families (positioning, not prompt-composer camera archetypes). */
export type MarketplaceHeroArchetype =
  | "premium_cinematic"
  | "luxury_minimal"
  | "dark_brutal"
  | "clean_marketplace"
  | "emotional_lifestyle"
  | "gift_oriented"
  | "anime_heavy"
  | "mass_market_bright"
  | "hyper_commercial"
  | "experimental";

export type HeroArchetypeEntity = {
  id: string;
  archetype: MarketplaceHeroArchetype;
  description: string;
  dominantPatterns: string[];
  dominantColors: string[];
  modelUsage: string;
  printStyle: string;
  readabilityBias: "low" | "mid" | "high";
  premiumSignal: "low" | "mid" | "high";
  saturationRisk: string;
  emotionalTone: string;
  marketplaceFit: string;
  recommendedUse: string;
  dangerZones: string[];
};

export type ArchetypeShare = {
  archetype: MarketplaceHeroArchetype;
  sharePct: number;
};

export type HeroArchetypeIntelligenceReport = {
  id: string;
  sourceSerpSnapshotId: string;
  query: string;
  marketplace: string;
  createdAt: number;
  /** Resolved copy at build time (locale of save for memory). */
  dominantSerpArchetypes: ArchetypeShare[];
  dominantSerpLines: string[];
  saturationSummary: string;
  overlapSummary: string;
  archetypePressureSummary: string;
  weakArchetypeLines: string[];
  underrepresentedLines: string[];
  ourArchetypes: ArchetypeShare[];
  ourArchetypeLines: string[];
  overlapRiskLine: string;
  differentiationOpportunityLine: string;
  premiumMismatchLine: string;
  emotionalMismatchLine: string;
  marketplaceFitLine: string;
  recommendedDirectionLine: string;
  vokraPrimaryDirectionLine: string;
  vokraFitLines: string[];
  practicalRecommendations: string[];
};

export const HERO_ARCHETYPE_INTELLIGENCE_MEMORY_SCHEMA = "vokra.heroArchetypeIntelligence.v1" as const;

export type HeroArchetypeIntelligenceMemoryPayload = {
  schema: typeof HERO_ARCHETYPE_INTELLIGENCE_MEMORY_SCHEMA;
  savedAt: number;
  report: HeroArchetypeIntelligenceReport;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};
