import type { CompetitiveGapAnalysis, OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import type { CompetitorSerpEnvelope } from "../competitor-serp/types";

/** Thumbnail / print survival tier from manual text cues only. */
export type HeroReadabilityLevel = "excellent" | "strong" | "acceptable" | "weak" | "critical";

export type HeroReadabilityEntity = {
  id: string;
  readabilityLevel: HeroReadabilityLevel;
  printVisibility: string;
  thumbnailClarity: string;
  focalHierarchy: string;
  contrastStrength: string;
  noiseDensity: string;
  mobileVisibility: string;
  visualCompetition: string;
  readabilityPressure: string;
  readabilityAdvantage: string;
  readabilityWeakness: string;
  marketplaceFit: string;
  recommendations: string[];
};

export type HeroReadabilityIntelligenceReport = {
  id: string;
  sourceSerpSnapshotId: string;
  query: string;
  marketplace: string;
  createdAt: number;
  readabilityPressureIndex: number;
  dominantSerpReadabilityLines: string[];
  dominantFieldQualityLine: string;
  readabilityPressureSummary: string;
  overloadedHeroLine: string;
  weakPrintVisibilityLine: string;
  premiumReadabilityShareLine: string;
  visualNoisePressureLine: string;
  focalCompetitionLine: string;
  weakReadabilityCompetitorLines: string[];
  ourReadabilityLines: string[];
  ourReadabilityEntity: HeroReadabilityEntity | null;
  readabilityGapLine: string;
  mobileClarityLine: string;
  readabilityRiskLine: string;
  archetypeReadabilityCrossLine: string | null;
  practicalRecommendations: string[];
};

export const HERO_READABILITY_INTELLIGENCE_MEMORY_SCHEMA = "vokra.heroReadabilityIntelligence.v1" as const;

export type HeroReadabilityIntelligenceMemoryPayload = {
  schema: typeof HERO_READABILITY_INTELLIGENCE_MEMORY_SCHEMA;
  savedAt: number;
  report: HeroReadabilityIntelligenceReport;
  serpEnvelope?: CompetitorSerpEnvelope | null;
  /** Optional: gap text echo for reopen context */
  gapEcho?: CompetitiveGapAnalysis | null;
  ourCardEcho?: OurCardCompetitiveSnapshot | null;
};
