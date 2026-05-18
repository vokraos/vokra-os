import type { CorridorStrategyReport } from "../corridor-strategy/types";
import type { EntitySnapshot } from "../entity-snapshot/types";
import type { SnapshotIntelligence } from "../entity-snapshot/intelligence";
import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";
import type { LaunchExecutionAction } from "../launch-ops/types";
import type { MarketplaceLaunchReview } from "../launch-ops/review/types";
import type { LaunchWaveOperationalEntity } from "../marketplace-operations/types";
import type { ScalingSafetyReport } from "../scaling-safety/types";
import type { AdvertisingPressureReport } from "../ad-pressure/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";

export const MARKET_TIMING_MEMORY_SCHEMA = "vokra.marketTiming.v1" as const;

export type CadenceLevel = "slow" | "stable" | "accelerated" | "overloaded" | "chaotic";

export type TimingState =
  | "well_spaced"
  | "crowded"
  | "overlapping"
  | "burnout_risk"
  | "refresh_due"
  | "unstable";

export type MarketTimingReport = {
  id: string;
  createdAt: number;
  corridor: string;
  marketplace: string;
  timingState: TimingState;
  launchCadence: CadenceLevel;
  refreshCadence: CadenceLevel;
  burnoutRisk: number;
  overlapPressure: number;
  operationalRhythm: CadenceLevel;
  spacingQuality: number;
  seasonalContext: string;
  refreshTiming: string;
  launchTiming: string;
  recommendedCadence: CadenceLevel;
  dangerousPatternKeys: string[];
  recommendedPatternKeys: string[];
  confidenceNoteKey: string;
  reasonKey: string;
  reasonVars: Record<string, string>;
};

export type MarketTimingGlobalContext = {
  snapshot: EntitySnapshot | null;
  intel: SnapshotIntelligence | null;
  marketplace: string;
  scalingReport: ScalingSafetyReport;
  adReport: AdvertisingPressureReport;
  heroFatigue: HeroFatigueIntelligenceReport | null;
  launchPlan: MarketplaceLaunchPlan | null;
  launchReviews: MarketplaceLaunchReview[];
  launchExecutionActions: LaunchExecutionAction[];
  waves: LaunchWaveOperationalEntity[];
  corridorReports: CorridorStrategyReport[];
  activeAssortmentCount: number;
};

export type MarketTimingMemoryPayload = {
  schema: typeof MARKET_TIMING_MEMORY_SCHEMA;
  savedAt: number;
  reports: MarketTimingReport[];
  cadence?: string[];
  patterns?: string[];
};
