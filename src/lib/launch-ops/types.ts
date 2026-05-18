import type { NavId } from "../../types";
import type { CollectionEntity } from "../collection-builder/types";
import type { CollectionPipelineBundle } from "../collection-builder/pipeline-types";
import type { HeroLaunchPackage } from "../hero-launch-package/types";
import type { ExecutionOrchestrationSnapshot } from "../execution-orchestrator/types";
import type { MarketplaceLaunchReview } from "./review/types";

export const LAUNCH_OPS_MEMORY_SCHEMA = "vokra.launchOperations.v1" as const;

export type LaunchReadinessLevel = "blocked" | "fragile" | "operational" | "ready" | "expansion_ready";

export type LaunchWaveKind = "hero" | "support" | "expansion" | "archive_refresh";

export type LaunchWaveStatus = "pending" | "ready" | "in_progress" | "blocked" | "done" | "hold";

export type LaunchWavePlan = {
  kind: LaunchWaveKind;
  status: LaunchWaveStatus;
  sequenceOrder: number;
  title: string;
  reason: string;
  skuNote: string;
};

export type LaunchSequenceStep = {
  order: number;
  label: string;
  waveKind: LaunchWaveKind | "gate";
  status: "pending" | "ready" | "blocked" | "done";
};

export type LaunchBlocker = {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  source: string;
};

export type LaunchTimingAdvice = {
  label: string;
  windowNote: string;
  patienceNote: string;
};

export type LaunchPressureProfile = {
  launchPressure: number;
  fboPressure: number;
  fbsPressure: number;
  productionPressure: number;
  packagingPressure: number;
};

export type MarketplaceLaunchPlan = {
  id: string;
  collectionId: string;
  collectionName: string;
  createdAt: number;
  marketplace: string;
  launchReadiness: LaunchReadinessLevel;
  launchReadinessScore: number;
  launchPressure: number;
  launchRisk: string;
  launchTiming: LaunchTimingAdvice;
  saturationRisk: string;
  stopConditions: string[];
  blockers: LaunchBlocker[];
  recommendations: string[];
  heroWave: LaunchWavePlan;
  supportWave: LaunchWavePlan;
  expansionWave: LaunchWavePlan;
  archiveRefreshWave: LaunchWavePlan;
  fboPressure: number;
  fbsPressure: number;
  launchSequence: LaunchSequenceStep[];
  operationalWarnings: string[];
  heroLaunchPackageId: string | null;
  linkedQuery: string | null;
};

export type LaunchOpsMemoryPayload = {
  schema: typeof LAUNCH_OPS_MEMORY_SCHEMA;
  savedAt: number;
  plan: MarketplaceLaunchPlan;
  context?: LaunchOpsGatherContext | null;
  review?: MarketplaceLaunchReview | null;
};

export type LaunchOpsGatherContext = {
  entitySnapshotId: string | null;
  collection: CollectionEntity | null;
  pipeline: CollectionPipelineBundle | null;
  heroLaunchPackage: HeroLaunchPackage | null;
  heroWinnerExists: boolean;
  promptPackInSession: boolean;
  visualAssetCount: number;
  cardPlanCount: number;
  cardPlansLaunchReady: number;
  orchestration: ExecutionOrchestrationSnapshot | null;
  synthesisLaunchReadiness: number;
  visualFatigue: number;
  seoSaturation: number;
  latestLaunchReview: MarketplaceLaunchReview | null;
};

export type LaunchExecutionActionStatus =
  | "new"
  | "accepted"
  | "in_progress"
  | "done"
  | "deferred"
  | "blocked";

export type LaunchExecutionStageId =
  | "blocker_review"
  | "launch_hold"
  | "expansion_wave"
  | "refresh_wave"
  | "launch_review";

export type LaunchExecutionAction = {
  id: string;
  sourceLaunchPlanId: string;
  sourceCollectionId: string;
  sourceCollectionName: string;
  sourceStage: LaunchExecutionStageId;
  title: string;
  reason: string;
  priority: "critical" | "high" | "medium" | "low";
  urgency: "low" | "medium" | "elevated" | "critical";
  targetSystem: string;
  suggestedDestination: NavId;
  linkedCorridor: string;
  marketplaceTarget: string;
  status: LaunchExecutionActionStatus;
  createdAt: number;
  updatedAt: number;
};

export const LAUNCH_EXECUTION_ACTIONS_STORAGE_KEY = "vokra.launchExecutionActions.v1" as const;
