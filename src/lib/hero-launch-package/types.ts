import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import type { HeroTestMatrix } from "../hero-test-matrix/types";
import type { HeroTestResultsBundle } from "../hero-test-results/types";

export const HERO_LAUNCH_PACKAGE_MEMORY_SCHEMA = "vokra.heroLaunchPackage.v1" as const;

export type HeroLaunchReadiness = "not_ready" | "partial" | "ready_for_manual_launch";

/** Human-ready hero card update package — no marketplace APIs or CTR claims. */
export type HeroLaunchPackage = {
  id: string;
  sourceResultBundleId: string;
  sourceMatrixId: string;
  winningVariantId: string;
  query: string;
  marketplace: string;
  createdAt: number;
  heroDirection: string;
  whyWinner: string;
  sourcePrompt: string;
  visualAssetId: string | null;
  cardPlanId: string | null;
  targetUsage: string;
  cardUpdateChecklist: string[];
  seoNotes: string[];
  titleNotes: string[];
  richContentNotes: string[];
  marketplaceWarnings: string[];
  postLaunchMonitoring: string[];
  readiness: HeroLaunchReadiness;
  missingItems: string[];
};

export type HeroLaunchPackageMemoryPayload = {
  schema: typeof HERO_LAUNCH_PACKAGE_MEMORY_SCHEMA;
  savedAt: number;
  package: HeroLaunchPackage;
  matrix?: HeroTestMatrix | null;
  resultsBundle?: HeroTestResultsBundle | null;
  serpEnvelope?: CompetitorSerpEnvelope | null;
};
