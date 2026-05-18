import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import type { HeroLaunchPackage } from "../hero-launch-package/types";
import type { HeroTestMatrix } from "../hero-test-matrix/types";
import type { HeroTestResultsBundle } from "../hero-test-results/types";

export const HERO_POST_LAUNCH_OBSERVATION_MEMORY_SCHEMA = "vokra.heroPostLaunchObservation.v1" as const;

/** Structured operator judgment — no automated marketplace metrics. */
export type ObservationLabel = "improved" | "stable" | "weakened" | "uncertain";

export type HeroPostLaunchObservation = {
  id: string;
  sourceLaunchPackageId: string;
  sourceWinnerId: string;
  query: string;
  marketplace: string;
  launchDate: string;
  observationDate: string;
  observationWindowDays: number;
  rankingObservation: string;
  competitorMovement: string;
  readabilityObservation: string;
  fatigueObservation: string;
  premiumPerceptionObservation: string;
  customerSignalObservation: string;
  operationalIssues: string;
  suspectedOutcome: string;
  nextRecommendation: string;
  refreshRisk: string;
  notes: string;
  /** Transparent heuristic lines tied to hero intelligence modules. */
  learningReinforcement: string[];
};

export type HeroPostLaunchObservationMemoryPayload = {
  schema: typeof HERO_POST_LAUNCH_OBSERVATION_MEMORY_SCHEMA;
  savedAt: number;
  observation: HeroPostLaunchObservation;
  launchPackage?: HeroLaunchPackage | null;
  matrix?: HeroTestMatrix | null;
  resultsBundle?: HeroTestResultsBundle | null;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};
