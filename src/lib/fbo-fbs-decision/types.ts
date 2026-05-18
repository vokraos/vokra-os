import type { AdvertisingPressureReport } from "../ad-pressure/types";
import type { AssortmentExecutionPlan } from "../assortment-actions/types";
import type { EconomicPressureReport } from "../economic-pressure/types";
import type { EconomicGuardrail } from "../economic-guardrails/types";
import type { EconomicPressureGatherContext } from "../economic-pressure/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { PricePositioningReport } from "../price-positioning/types";
import type { ScalingSafetyReport } from "../scaling-safety/types";
import type { UnitEconomicsResolvedMatch } from "../unit-economics/types";

export const FBO_FBS_DECISION_MEMORY_SCHEMA = "vokra.fboFbsDecision.v1" as const;

export type FboRecommendedMode =
  | "keep_fbs"
  | "test_fbo_small"
  | "move_to_fbo"
  | "mixed_mode"
  | "stop_fbo_expansion"
  | "cleanup_before_fbo";

export type FboDecisionReadiness = "blocked" | "fragile" | "test_ready" | "ready" | "expansion_ready";

export type FboFitLevel = "blocked" | "fragile" | "fair" | "good" | "strong";

export type FboDecisionConfidence = "low" | "moderate" | "high";

export type FboFbsDecisionReport = {
  id: string;
  createdAt: number;
  targetLabel: string;
  corridor: string;
  marketplace: string;
  currentStockMode: string;
  recommendedMode: FboRecommendedMode;
  decisionConfidence: FboDecisionConfidence;
  reasonKey: string;
  reasonVars: Record<string, string>;
  readiness: FboDecisionReadiness;
  economicsFit: FboFitLevel;
  launchFit: FboFitLevel;
  visualContentFit: FboFitLevel;
  seoFit: FboFitLevel;
  operationalFit: FboFitLevel;
  riskKeys: string[];
  allowedActionKeys: string[];
  forbiddenActionKeys: string[];
  recommendedNextStepKey: string;
  recommendedNextStepVars: Record<string, string>;
  testWaveSuggestionKey: string;
  testWaveSuggestionVars: Record<string, string>;
  confidenceNoteKey: string;
};

export type FboFbsDecisionGatherContext = {
  econCtx: EconomicPressureGatherContext;
  econReport: EconomicPressureReport;
  scalingReport: ScalingSafetyReport;
  guardrails: EconomicGuardrail[];
  launchPlan: MarketplaceLaunchPlan | null;
  priceReport: PricePositioningReport | null;
  adReport: AdvertisingPressureReport;
  launchEconFbo: UnitEconomicsResolvedMatch | null;
  executionPlan: AssortmentExecutionPlan | null;
  targetLabel: string;
  corridor: string;
  marketplace: string;
};

export type FboFbsDecisionMemoryPayload = {
  schema: typeof FBO_FBS_DECISION_MEMORY_SCHEMA;
  savedAt: number;
  report: FboFbsDecisionReport;
  risks?: string[];
  testWaveSuggestion?: string;
};
