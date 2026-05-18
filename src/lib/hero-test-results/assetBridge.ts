import type { HeroTestMatrix, HeroTestVariant } from "../hero-test-matrix/types";
import type { VisualAssetEntity, VisualAssetFatigueTracking, VisualAssetRole, VisualAssetStatus } from "../visual-assets/types";
import type { HeroTestFinalUse, HeroTestResult } from "./types";

function newAssetId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `va-${crypto.randomUUID()}`;
  return `va-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function roleFromFinalUse(finalUse: HeroTestFinalUse): VisualAssetRole | null {
  switch (finalUse) {
    case "wb_hero":
      return "wb_hero";
    case "ozon_hero":
      return "ozon_hero";
    case "rich_content":
      return "rich_content";
    case "campaign":
      return "campaign";
    case "reels":
      return "reels";
    case "discard":
      return null;
    default:
      return null;
  }
}

function buildFatigue(fatigueResistance: number | null): VisualAssetFatigueTracking {
  const inv = fatigueResistance !== null ? Math.max(1, Math.min(5, 6 - fatigueResistance)) : null;
  return {
    visualAgeDays: 0,
    usageCount: 0,
    exposureNote: "Hero test matrix winner — manual review only.",
    fatigueRiskScore: inv,
    refreshRecommendation:
      inv !== null && inv >= 4
        ? "Test review flagged fatigue risk — plan refresh after placement."
        : "Monitor after hero swap; no live CTR data in OS.",
  };
}

export type RegisterWinnerContext = {
  corridor: string;
  matrix: HeroTestMatrix;
  variant: HeroTestVariant;
  result: HeroTestResult;
};

/** Registry row from manual test result — no binary media, no job required. */
export function buildVisualAssetFromTestResult(ctx: RegisterWinnerContext): VisualAssetEntity | null {
  const { result, variant, matrix, corridor } = ctx;
  const role = roleFromFinalUse(result.finalUse);
  if (!role) return null;

  const now = Date.now();
  const qs = result.qualityScores;
  const coll = corridor.trim() || "hero_test_matrix";
  const approvedUsage = result.finalUse === "discard" ? role : result.finalUse;

  const status: VisualAssetStatus = result.resultStatus === "winner" ? "approved" : "testing";

  return {
    id: newAssetId(),
    sourceJobId: result.id,
    promptPackId: variant.visualJobKind,
    collectionId: coll.slice(0, 64),
    collectionName: `Hero test · ${matrix.query}`.slice(0, 80),
    title: `${variant.variantName} · ${matrix.query}`.slice(0, 120),
    assetRole: role,
    usageTarget: approvedUsage,
    sourcePrompt: [variant.visualDirection, variant.hypothesis, `Changed: ${variant.changedVariable}`].join("\n").slice(0, 4000),
    selectedResultNote: result.selectedVisualNote.slice(0, 2000),
    approvedUsage,
    brandFitScore: qs.brandFit,
    marketplaceClarityScore: qs.marketplaceClarity,
    printReadabilityScore: qs.readability ?? qs.printVisibility,
    premiumPerceptionScore: qs.premiumPerception,
    fatigueRiskScore: qs.fatigueResistance !== null ? Math.max(1, Math.min(5, 6 - qs.fatigueResistance)) : null,
    status,
    linkedSkuIds: [],
    linkedCardIds: [],
    linkedCampaignId: null,
    fatigue: buildFatigue(qs.fatigueResistance),
    createdAt: now,
    updatedAt: now,
  };
}
