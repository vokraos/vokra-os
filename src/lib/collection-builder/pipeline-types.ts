/**
 * Phase 11 — Collection → execution pipeline (operational, not decorative).
 */

import type { ActionCommand } from "../action-command/types";
import type { OrchestratorSystem } from "../execution-orchestrator/types";
import type { CollectionEntity } from "./types";

export type CollectionStageStatus =
  | "pending"
  | "ready"
  | "in_progress"
  | "blocked"
  | "done"
  | "skipped";

export type CollectionStageDef = {
  readonly index: number;
  readonly messageKey: string;
  readonly owner: OrchestratorSystem;
};

export const COLLECTION_PIPELINE_STAGES: readonly CollectionStageDef[] = [
  { index: 0, messageKey: "collectionBuilder.stage.dna", owner: "brand_dna" },
  { index: 1, messageKey: "collectionBuilder.stage.corridor", owner: "mission_control" },
  { index: 2, messageKey: "collectionBuilder.stage.heroSku", owner: "mission_control" },
  { index: 3, messageKey: "collectionBuilder.stage.supportSku", owner: "mission_control" },
  { index: 4, messageKey: "collectionBuilder.stage.print", owner: "production" },
  { index: 5, messageKey: "collectionBuilder.stage.heroVisual", owner: "visual" },
  { index: 6, messageKey: "collectionBuilder.stage.seoCluster", owner: "seo" },
  { index: 7, messageKey: "collectionBuilder.stage.rich", owner: "seo" },
  { index: 8, messageKey: "collectionBuilder.stage.launchWave", owner: "command" },
  { index: 9, messageKey: "collectionBuilder.stage.productionFit", owner: "production" },
  { index: 10, messageKey: "collectionBuilder.stage.fbo", owner: "production" },
  { index: 11, messageKey: "collectionBuilder.stage.deploy", owner: "campaign" },
  { index: 12, messageKey: "collectionBuilder.stage.feedback", owner: "mission_control" },
] as const;

export type CollectionStage = {
  readonly index: number;
  readonly messageKey: string;
  readonly owner: OrchestratorSystem;
  readonly status: CollectionStageStatus;
  readonly dependency: string;
  readonly risk: string;
  readonly output: string;
};

export type CollectionReadinessBreakdown = {
  brandReadiness: number;
  visualReadiness: number;
  seoReadiness: number;
  productionReadiness: number;
  marketplaceReadiness: number;
  timingReadiness: number;
  executionReadiness: number;
  /** 0–100 aggregate */
  collectionLaunchReadiness: number;
};

export type CollectionStructuredStop = {
  readonly id: string;
  readonly label: string;
  readonly active: boolean;
};

export type CollectionVisualWorkflowOutput = {
  heroPhotoBrief: string;
  supportingPhotoDirection: string;
  modelStyle: string;
  backgroundStyle: string;
  marketplaceMainCardLogic: string;
  reelsConcept: string;
  visualRefreshRule: string;
};

export type CollectionSeoWorkflowOutput = {
  wbTitleLogic: string;
  ozonTitleLogic: string;
  primaryKeywords: readonly string[];
  secondaryKeywords: readonly string[];
  richContentAngle: string;
  forbiddenSemanticDrift: readonly string[];
};

export type CollectionProductionWorkflowOutput = {
  dtfSuitability: string;
  printComplexity: string;
  blankAvailabilityRisk: string;
  packagingImpact: string;
  fboPrepImpact: string;
  productionBottleneckWarning: string;
};

export type CollectionExecutionRoute = {
  collectionId: string;
  routeId: string;
  readiness: number;
  currentStageIndex: number;
  currentStageKey: string;
  nextAction: string;
  blockers: readonly string[];
  involvedSystems: readonly string[];
  productionPressure: string;
  launchRisk: string;
  expectedImpact: string;
  stopConditions: readonly string[];
};

export type CollectionPipelineBundle = {
  readonly entity: CollectionEntity;
  readonly readiness: CollectionReadinessBreakdown;
  readonly executionRoute: CollectionExecutionRoute;
  readonly stages: readonly CollectionStage[];
  /** Collection-scoped operational commands (shape-compatible with ActionCommand). */
  readonly collectionCommands: readonly ActionCommand[];
  /** Subset / mirror of live orchestrator layer for the same pulse (no re-derivation). */
  readonly orchestratorCommandLayer: import("../action-command/types").ActionCommandLayerSnapshot;
  readonly structuredStops: readonly CollectionStructuredStop[];
  readonly visualWorkflow: CollectionVisualWorkflowOutput;
  readonly seoWorkflow: CollectionSeoWorkflowOutput;
  readonly productionWorkflow: CollectionProductionWorkflowOutput;
};

export type CollectionPipelineBuildInput = {
  readonly entity: CollectionEntity;
  readonly orchestration: import("../execution-orchestrator/types").ExecutionOrchestrationSnapshot;
  readonly launchReadiness: number;
  readonly brandFitRank: number;
  readonly visualFatigue: number;
  readonly seoSaturation: number;
  readonly riskProductionOverload: number;
  readonly patienceScore: number;
  readonly locale: "ru" | "en";
};
