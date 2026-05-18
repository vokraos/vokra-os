import type { NavId } from "../../types";
import type { FounderCommandBrief } from "../founder-brief/types";
import type { AssortmentExecutionPlan } from "../assortment-actions/types";
import type { HeroCommandSnapshot } from "../hero-command/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { MarketplaceLaunchReview } from "../launch-ops/review/types";
import type { EconomicPressureReport } from "../economic-pressure/types";
import type { PricePositioningReport } from "../price-positioning/types";
import type { AdvertisingPressureReport } from "../ad-pressure/types";
import type { ScalingSafetyReport } from "../scaling-safety/types";
import type { FboFbsDecisionReport } from "../fbo-fbs-decision/types";
import type { CorridorStrategyReport } from "../corridor-strategy/types";
import type { MarketTimingReport } from "../market-timing/types";
import type { EconomicGuardrail } from "../economic-guardrails/types";
import type { AuditHealthLevel } from "../os-health-audit/types";
import type { EntitySnapshot } from "../entity-snapshot/types";

export const CONTROL_TOWER_MEMORY_SCHEMA = "vokra.controlTower.v1" as const;

export type ControlTowerOverallState = "stable" | "pressured" | "fragile" | "blocked" | "expansion_ready";

export type SystemHealthLevel = "stable" | "watch" | "pressured" | "blocked" | "ready";

export type ControlTowerSystemId =
  | "execution"
  | "hero"
  | "launch"
  | "economics"
  | "scaling"
  | "fbo"
  | "corridor"
  | "timing";

export type ControlTowerSystemTile = {
  id: ControlTowerSystemId | "memory";
  health: SystemHealthLevel;
  summaryKey: string;
  summaryVars: Record<string, string>;
  navId: NavId;
};

export type StrategicControlTowerSnapshot = {
  id: string;
  createdAt: number;
  overallState: ControlTowerOverallState;
  topPriorityKey: string;
  topPriorityVars: Record<string, string>;
  blockedSystemKey: string;
  blockedSystemVars: Record<string, string>;
  leverageSystemKey: string;
  leverageSystemVars: Record<string, string>;
  riskSystemKey: string;
  riskSystemVars: Record<string, string>;
  executionState: SystemHealthLevel;
  heroState: SystemHealthLevel;
  launchState: SystemHealthLevel;
  economicsState: SystemHealthLevel;
  scalingState: SystemHealthLevel;
  fboState: SystemHealthLevel;
  corridorState: SystemHealthLevel;
  timingState: SystemHealthLevel;
  memorySignalKey: string;
  memorySignalVars: Record<string, string>;
  nextBestRoute: NavId;
  warningKeys: string[];
  confidenceNoteKey: string;
  tiles: ControlTowerSystemTile[];
  osAuditHealth: AuditHealthLevel;
  osAuditTopMissingKey: string;
  osAuditTopMissingVars: Record<string, string>;
  osAuditShowLink: boolean;
  executionFeedbackLineKey: string | null;
  executionFeedbackLineVars: Record<string, string>;
  productionPressureLineKey: string | null;
  productionPressureLineVars: Record<string, string>;
};

export type ControlTowerGatherContext = {
  snapshot: EntitySnapshot | null;
  founderBrief: FounderCommandBrief | null;
  executionPlan: AssortmentExecutionPlan | null;
  heroSnapshot: HeroCommandSnapshot | null;
  launchPlan: MarketplaceLaunchPlan | null;
  launchReview: MarketplaceLaunchReview | null;
  econReport: EconomicPressureReport;
  priceReport: PricePositioningReport | null;
  adReport: AdvertisingPressureReport;
  scalingReport: ScalingSafetyReport;
  fboReport: FboFbsDecisionReport;
  corridorReport: CorridorStrategyReport | null;
  timingReport: MarketTimingReport | null;
  guardrails: EconomicGuardrail[];
  savedModuleHints: number;
};

export type ControlTowerMemoryPayload = {
  schema: typeof CONTROL_TOWER_MEMORY_SCHEMA;
  savedAt: number;
  snapshot: StrategicControlTowerSnapshot;
  systemStates?: string[];
};
