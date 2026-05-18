import { newHeroTestResultId } from "./ids";
import type { HeroTestFinalUse, HeroTestQualityScores, HeroTestResult, HeroTestResultStatus } from "./types";
import type { HeroTestMatrix, HeroTestVariant } from "../hero-test-matrix/types";

export const EMPTY_HERO_TEST_QUALITY_SCORES: HeroTestQualityScores = {
  readability: null,
  premiumPerception: null,
  printVisibility: null,
  marketplaceClarity: null,
  brandFit: null,
  fatigueResistance: null,
};

export function defaultFinalUseForMarketplace(marketplace: string): HeroTestFinalUse {
  if (marketplace === "ozon" || marketplace.toLowerCase().includes("ozon")) return "ozon_hero";
  return "wb_hero";
}

export function createEmptyResultForVariant(matrix: HeroTestMatrix, variant: HeroTestVariant): HeroTestResult {
  const now = Date.now();
  return {
    id: newHeroTestResultId(),
    sourceMatrixId: matrix.id,
    sourceVariantId: variant.id,
    query: matrix.query,
    marketplace: matrix.marketplace,
    createdAt: now,
    updatedAt: now,
    resultStatus: "pending",
    selectedVisualNote: "",
    whySelected: "",
    whyRejected: "",
    issueFound: "",
    revisionInstruction: "",
    finalUse: defaultFinalUseForMarketplace(matrix.marketplace),
    qualityScores: { ...EMPTY_HERO_TEST_QUALITY_SCORES },
    decisionConfidence: "",
  };
}

export function emptyBundle(matrix: HeroTestMatrix): import("./types").HeroTestResultsBundle {
  return {
    sourceMatrixId: matrix.id,
    query: matrix.query,
    marketplace: matrix.marketplace,
    updatedAt: Date.now(),
    results: matrix.testVariants.map((v) => createEmptyResultForVariant(matrix, v)),
    winnerVariantId: null,
    winnerSummary: "",
    recommendedNextActions: [],
    registeredAssetId: null,
  };
}

export function parseScoreInput(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return n;
}

export function clampResultStatus(s: string): HeroTestResultStatus {
  const allowed: HeroTestResultStatus[] = [
    "pending",
    "shortlisted",
    "winner",
    "needs_revision",
    "rejected",
    "archived",
  ];
  return allowed.includes(s as HeroTestResultStatus) ? (s as HeroTestResultStatus) : "pending";
}

export function clampFinalUse(s: string): HeroTestFinalUse {
  const allowed: HeroTestFinalUse[] = ["wb_hero", "ozon_hero", "rich_content", "campaign", "reels", "discard"];
  return allowed.includes(s as HeroTestFinalUse) ? (s as HeroTestFinalUse) : "wb_hero";
}
