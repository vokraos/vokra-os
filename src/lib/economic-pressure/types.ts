import type { NavId } from "../../types";
import type { EntitySnapshot } from "../entity-snapshot/types";
import type { SnapshotIntelligence } from "../entity-snapshot/intelligence";
import type { AssortmentExecutionPlan } from "../assortment-actions/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { MarketplaceLaunchReview } from "../launch-ops/review/types";
import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";

export const ECONOMIC_PRESSURE_MEMORY_SCHEMA = "vokra.economicPressure.v1" as const;

export type EconomicPressureLevel = "low" | "manageable" | "elevated" | "dangerous" | "critical";

export type PressureZone = {
  id: string;
  label: string;
  level: EconomicPressureLevel;
  score: number;
  corridor?: string;
  navId: NavId;
};

export type EconomicPressureReport = {
  id: string;
  createdAt: number;
  operationalPressure: number;
  expansionPressure: number;
  fragmentationPressure: number;
  warehousePressure: number;
  refreshPressure: number;
  launchPressure: number;
  saturationPressure: number;
  assortmentComplexity: number;
  operationalLevel: EconomicPressureLevel;
  expansionLevel: EconomicPressureLevel;
  fragmentationLevel: EconomicPressureLevel;
  warehouseLevel: EconomicPressureLevel;
  refreshLevel: EconomicPressureLevel;
  launchLevel: EconomicPressureLevel;
  dangerousExpansionZones: PressureZone[];
  stableZones: PressureZone[];
  recommendedFocus: string[];
  stopExpansionSignals: string[];
  operationalWarnings: string[];
  confidenceNote: string;
  /** Compact guardrail lines from manual unit economics (not marketplace truth). */
  guardrailSummary?: string[];
};

export type EconomicPressureGatherContext = {
  snapshot: EntitySnapshot | null;
  intel: SnapshotIntelligence | null;
  executionPlan: AssortmentExecutionPlan | null;
  actionCount: number;
  activeActionCount: number;
  launchPlan: MarketplaceLaunchPlan | null;
  launchReview: MarketplaceLaunchReview | null;
  heroFatigue: HeroFatigueIntelligenceReport | null;
  visualFatigueHint: number;
  seoSaturationHint: number;
};

export type EconomicPressureMemoryPayload = {
  schema: typeof ECONOMIC_PRESSURE_MEMORY_SCHEMA;
  savedAt: number;
  report: EconomicPressureReport;
  guardrailSummary?: string[];
};
