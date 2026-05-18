import type { AdvertisingPressureReport } from "../ad-pressure/types";
import type { AssortmentExecutionPlan } from "../assortment-actions/types";
import type { EconomicPressureReport } from "../economic-pressure/types";
import type { EconomicGuardrail } from "../economic-guardrails/types";
import type { EconomicPressureGatherContext } from "../economic-pressure/types";
import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { PricePositioningReport } from "../price-positioning/types";
import type { UnitEconomicsResolvedMatch } from "../unit-economics/types";

export const SCALING_SAFETY_MEMORY_SCHEMA = "vokra.scalingSafety.v1" as const;

export type ScalingSafetyLevel = "safe" | "cautious" | "fragile" | "unsafe" | "blocked";

export type ScalingMode =
  | "scale"
  | "scale_carefully"
  | "refresh_only"
  | "cleanup_first"
  | "hold_expansion"
  | "stop_and_review";

export type ScalingSafetyReport = {
  id: string;
  createdAt: number;
  targetLabel: string;
  corridor: string;
  marketplace: string;
  stockMode: string;
  safetyLevel: ScalingSafetyLevel;
  scalingMode: ScalingMode;
  mainReasonKey: string;
  mainReasonVars: Record<string, string>;
  supportingSignalKeys: string[];
  blockedByKeys: string[];
  allowedActionKeys: string[];
  forbiddenActionKeys: string[];
  recommendedNextStepKey: string;
  recommendedNextStepVars: Record<string, string>;
  confidenceNoteKey: string;
};

export type ScalingSafetyGatherContext = {
  econCtx: EconomicPressureGatherContext;
  econReport: EconomicPressureReport;
  priceReport: PricePositioningReport | null;
  adReport: AdvertisingPressureReport;
  guardrails: EconomicGuardrail[];
  launchPlan: MarketplaceLaunchPlan | null;
  heroFatigue: HeroFatigueIntelligenceReport | null;
  launchEcon: UnitEconomicsResolvedMatch | null;
  executionPlan: AssortmentExecutionPlan | null;
  targetLabel: string;
  corridor: string;
  marketplace: string;
  stockMode: string;
};

export type ScalingSafetyMemoryPayload = {
  schema: typeof SCALING_SAFETY_MEMORY_SCHEMA;
  savedAt: number;
  report: ScalingSafetyReport;
  supportingSignals?: string[];
  recommendations?: string[];
};
