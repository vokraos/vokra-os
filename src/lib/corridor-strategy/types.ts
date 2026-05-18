import type { EntitySnapshot } from "../entity-snapshot/types";
import type { SnapshotIntelligence } from "../entity-snapshot/intelligence";
import type { FboFbsDecisionReport } from "../fbo-fbs-decision/types";
import type { ScalingSafetyReport } from "../scaling-safety/types";

export const CORRIDOR_STRATEGY_MEMORY_SCHEMA = "vokra.corridorStrategy.v1" as const;

export type CorridorState =
  | "emerging"
  | "scalable"
  | "overloaded"
  | "fragmented"
  | "unstable"
  | "refresh_needed"
  | "archive_candidate";

export type CorridorRecommendedStrategy =
  | "dominate"
  | "scale_carefully"
  | "refresh"
  | "consolidate"
  | "reduce"
  | "archive"
  | "rebuild";

export type CorridorStrategyReport = {
  id: string;
  createdAt: number;
  corridor: string;
  marketplace: string;
  corridorState: CorridorState;
  dominancePotential: number;
  saturationPressure: number;
  fragmentationPressure: number;
  expansionSafety: number;
  fulfillmentFit: number;
  refreshNeed: number;
  archiveRisk: number;
  seoCoverage: number;
  heroPressure: number;
  operationalBurden: number;
  recommendedStrategy: CorridorRecommendedStrategy;
  forbiddenMoveKeys: string[];
  recommendedMoveKeys: string[];
  confidenceNoteKey: string;
  strategyReasonKey: string;
  strategyReasonVars: Record<string, string>;
};

export type CorridorStrategyGlobalContext = {
  snapshot: EntitySnapshot | null;
  intel: SnapshotIntelligence | null;
  marketplace: string;
  scalingReport: ScalingSafetyReport;
  fboReport: FboFbsDecisionReport;
  maxCorridorTotal: number;
};

export type CorridorStrategyMemoryPayload = {
  schema: typeof CORRIDOR_STRATEGY_MEMORY_SCHEMA;
  savedAt: number;
  reports: CorridorStrategyReport[];
  strategies?: string[];
  moves?: string[];
};
