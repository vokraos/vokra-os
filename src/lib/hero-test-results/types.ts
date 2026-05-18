import type { HeroTestMatrix } from "../hero-test-matrix/types";

export const HERO_TEST_RESULTS_MEMORY_SCHEMA = "vokra.heroTestResults.v1" as const;

export type HeroTestResultStatus =
  | "pending"
  | "shortlisted"
  | "winner"
  | "needs_revision"
  | "rejected"
  | "archived";

export type HeroTestFinalUse = "wb_hero" | "ozon_hero" | "rich_content" | "campaign" | "reels" | "discard";

/** 1–5 manual scores; null = not rated. */
export type HeroTestQualityScores = {
  readability: number | null;
  premiumPerception: number | null;
  printVisibility: number | null;
  marketplaceClarity: number | null;
  brandFit: number | null;
  fatigueResistance: number | null;
};

export type HeroTestResult = {
  id: string;
  sourceMatrixId: string;
  sourceVariantId: string;
  query: string;
  marketplace: string;
  createdAt: number;
  updatedAt: number;
  resultStatus: HeroTestResultStatus;
  selectedVisualNote: string;
  whySelected: string;
  whyRejected: string;
  issueFound: string;
  revisionInstruction: string;
  finalUse: HeroTestFinalUse;
  qualityScores: HeroTestQualityScores;
  decisionConfidence: string;
};

export type HeroTestResultsBundle = {
  sourceMatrixId: string;
  query: string;
  marketplace: string;
  updatedAt: number;
  results: HeroTestResult[];
  winnerVariantId: string | null;
  winnerSummary: string;
  recommendedNextActions: string[];
  registeredAssetId: string | null;
};

export type HeroTestResultsMemoryPayload = {
  schema: typeof HERO_TEST_RESULTS_MEMORY_SCHEMA;
  savedAt: number;
  bundle: HeroTestResultsBundle;
  matrix?: HeroTestMatrix | null;
  serpEnvelope?: import("../competitor-serp/types").CompetitorSerpEnvelope | null;
};
