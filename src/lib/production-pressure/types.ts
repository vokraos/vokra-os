import type {
  CapacityInterpretation,
  ProductionCapacityProfile,
  ProductionLoadSnapshot,
  ProductionShiftScenario,
  ResolvedCapacitySnapshot,
} from "./capacity-types";
import type { ProductionDailyPlan } from "./daily-plan-types";
import type { ProductionShiftLearningSummary } from "./shift-feedback-types";
import type { ShiftRequirementRecommendation } from "./shift-requirement-types";
import type { AssortmentExecutionPlan } from "../assortment-actions/types";
import type { ExecutionFeedbackSignals } from "../execution-feedback/signals";
import type { FboFbsSignals } from "../fbo-fbs-decision/signals";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { ScalingSafetySignals } from "../scaling-safety/signals";

export const PRODUCTION_PRESSURE_MEMORY_SCHEMA = "vokra.productionPressure.v1" as const;
export const PRODUCTION_PRESSURE_MEMORY_SCHEMA_V2 = "vokra.productionPressure.v2" as const;
export const PRODUCTION_PRESSURE_MEMORY_SCHEMA_V3 = "vokra.productionPressure.v3" as const;
export const PRODUCTION_PRESSURE_MEMORY_SCHEMA_V4 = "vokra.productionPressure.v4" as const;
export const PRODUCTION_PRESSURE_MEMORY_SCHEMA_V5 = "vokra.productionPressure.v5" as const;

export const PRODUCTION_PRESSURE_EVENT = "vokra:production-pressure-updated" as const;

export type ProductionState = "stable" | "pressured" | "overloaded" | "unstable" | "blocked";

export type PressureBand = "low" | "moderate" | "high" | "critical";

export type PressureScore = {
  score: number;
  band: PressureBand;
  summaryKey: string;
  summaryVars: Record<string, string>;
};

export type ProductionBottleneck = {
  id: string;
  labelKey: string;
  labelVars: Record<string, string>;
  severity: "medium" | "high";
};

export type ProductionPressureReport = {
  id: string;
  createdAt: number;
  targetLabel: string;
  productionState: ProductionState;
  printPressure: PressureScore;
  packagingPressure: PressureScore;
  fulfillmentPressure: PressureScore;
  launchLoad: PressureScore;
  operatorBottlenecks: ProductionBottleneck[];
  waveCollisionRisk: PressureScore;
  cadenceStability: PressureScore;
  dangerousZones: string[];
  recommendedActions: string[];
  forbiddenMoves: string[];
  confidenceNoteKey: string;
  loadSnapshot: ProductionLoadSnapshot;
  capacity: CapacityInterpretation;
  resolvedCapacity: ResolvedCapacitySnapshot | null;
  shiftRequirement: ShiftRequirementRecommendation;
  dailyPlan: ProductionDailyPlan;
  shiftLearning: ProductionShiftLearningSummary;
};

export type ProductionPressureGatherContext = {
  snapshotId: string | null;
  targetLabel: string;
  corridor: string;
  launchPlan: MarketplaceLaunchPlan | null;
  executionPlan: AssortmentExecutionPlan | null;
  scalingSignals: ScalingSafetySignals | null;
  feedbackSignals: ExecutionFeedbackSignals;
  fboSignals: FboFbsSignals | null;
  todayActionCount: number;
  weekActionCount: number;
  launchActionCount: number;
  refreshActionCount: number;
  visualQueueCount: number;
  cardDraftCount: number;
  activeWaveCount: number;
  overlappingWaves: boolean;
  supportSkuDensity: number;
  orchestrationPackaging: number;
  orchestrationDtf: number;
  launchPressure: number;
  fboPressure: number;
  fbsPressure: number;
};

export type ProductionPressureMemoryPayload = {
  schema:
    | typeof PRODUCTION_PRESSURE_MEMORY_SCHEMA
    | typeof PRODUCTION_PRESSURE_MEMORY_SCHEMA_V2
    | typeof PRODUCTION_PRESSURE_MEMORY_SCHEMA_V3
    | typeof PRODUCTION_PRESSURE_MEMORY_SCHEMA_V4
    | typeof PRODUCTION_PRESSURE_MEMORY_SCHEMA_V5;
  savedAt: number;
  report: ProductionPressureReport;
  bottlenecks?: ProductionBottleneck[];
  dangerousZones?: string[];
  recommendations?: string[];
  capacityProfiles?: ProductionCapacityProfile[];
  activeProfileId?: string | null;
  loadSnapshot?: ProductionLoadSnapshot;
  capacityComparisons?: CapacityInterpretation;
  shiftScenarios?: ProductionShiftScenario[];
  activeScenarioId?: string | null;
  resolvedCapacity?: ResolvedCapacitySnapshot | null;
  shiftRequirement?: ShiftRequirementRecommendation;
  dailyPlan?: ProductionDailyPlan;
};
