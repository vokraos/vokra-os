import type { CompetitorSerpEnvelope } from "../competitor-serp/types";

export const COMPETITIVE_GAP_ANALYSIS_MEMORY_SCHEMA = "vokra.competitiveGapAnalysis.v1" as const;

/** Manual founder input — no uploads, no APIs. */
export type OurCardCompetitiveSnapshot = {
  id: string;
  query: string;
  marketplace: string;
  cardTitle: string;
  skuCode: string;
  price: number | null;
  heroImageNote: string;
  visualPattern: string;
  colorDominance: string;
  modelPresence: string;
  printReadability: string;
  perceivedPremiumLevel: string;
  brandFit: string;
  differentiationNote: string;
  createdAt: number;
};

/** Qualitative gaps only — no CTR, no marketplace truth. */
export type CompetitiveGapAnalysis = {
  id: string;
  sourceSerpSnapshotId: string;
  ourCardSnapshotId: string;
  query: string;
  marketplace: string;
  createdAt: number;
  priceGap: string;
  visualGap: string;
  premiumGap: string;
  readabilityGap: string;
  differentiationGap: string;
  saturationFit: string;
  riskFlags: string[];
  advantagePoints: string[];
  weaknessPoints: string[];
  recommendedChanges: string[];
  nextActions: string[];
};

export type CompetitiveGapAnalysisMemoryPayload = {
  schema: typeof COMPETITIVE_GAP_ANALYSIS_MEMORY_SCHEMA;
  savedAt: number;
  ourCard: OurCardCompetitiveSnapshot;
  gap: CompetitiveGapAnalysis;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};
