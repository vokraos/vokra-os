import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import type { CompetitiveGapAnalysis, OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { HeroBattlePlan } from "../hero-battle-plan/types";
import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";
import type { HeroLaunchPackage } from "../hero-launch-package/types";
import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import type { HeroPostLaunchObservation } from "../hero-post-launch-observation/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";
import type { HeroTestMatrix } from "../hero-test-matrix/types";
import type { HeroTestResultsBundle } from "../hero-test-results/types";

export const HERO_COMMAND_MEMORY_SCHEMA = "vokra.heroCommand.v1" as const;

export type HeroWorkflowStageId =
  | "serp"
  | "gap"
  | "archetype"
  | "readability"
  | "fatigue"
  | "battlePlan"
  | "testMatrix"
  | "results"
  | "launchPackage"
  | "observation";

export type HeroStageStatus = "missing" | "ready" | "active" | "needs_review" | "completed";

export type HeroWorkflowStage = {
  id: HeroWorkflowStageId;
  status: HeroStageStatus;
};

export type HeroCommandSourceIds = {
  serpSnapshotId: string | null;
  gapId: string | null;
  archetypeReportId: string | null;
  readabilityReportId: string | null;
  fatigueReportId: string | null;
  battlePlanId: string | null;
  testMatrixId: string | null;
  resultsBundleMatrixId: string | null;
  launchPackageId: string | null;
  observationId: string | null;
  heroPlanId: string | null;
};

export type HeroCommandSnapshot = {
  id: string;
  updatedAt: number;
  query: string;
  marketplace: string;
  currentDirection: string;
  winnerVariantLabel: string | null;
  launchReadiness: string | null;
  postLaunchStatus: string | null;
  nextStepKey: string;
  stages: HeroWorkflowStage[];
  sourceIds: HeroCommandSourceIds;
  hasActiveWorkflow: boolean;
};

export type HeroWorkflowArtifacts = {
  serp: CompetitorSerpEnvelope | null;
  ourCard: OurCardCompetitiveSnapshot | null;
  gap: CompetitiveGapAnalysis | null;
  heroPlan: CompetitiveHeroImprovementPlan | null;
  archetype: HeroArchetypeIntelligenceReport | null;
  readability: HeroReadabilityIntelligenceReport | null;
  fatigue: HeroFatigueIntelligenceReport | null;
  battlePlan: HeroBattlePlan | null;
  testMatrix: HeroTestMatrix | null;
  resultsBundle: HeroTestResultsBundle | null;
  launchPackage: HeroLaunchPackage | null;
  postLaunchObservation: HeroPostLaunchObservation | null;
};

export type HeroCommandMemoryPayload = {
  schema: typeof HERO_COMMAND_MEMORY_SCHEMA;
  savedAt: number;
  snapshot: HeroCommandSnapshot;
  artifacts?: HeroWorkflowArtifacts | null;
};
