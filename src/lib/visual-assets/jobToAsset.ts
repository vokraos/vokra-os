import type { VisualProductionJob } from "../visual-production/types";
import type { VisualAssetEntity, VisualAssetFatigueTracking, VisualAssetRole, VisualAssetStatus } from "./types";

function newAssetId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `va-${crypto.randomUUID()}`;
  return `va-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function scoreOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function deriveAssetRole(job: VisualProductionJob): VisualAssetRole {
  const u = job.approvedUsages;
  switch (job.jobType) {
    case "hero_visual":
      if (u.includes("wb_hero")) return "wb_hero";
      if (u.includes("ozon_hero")) return "ozon_hero";
      return "wb_hero";
    case "detail_shot":
      return "detail_shot";
    case "size_grid_visual":
      return "size_grid";
    case "reels_concept":
      return "reels";
    case "campaign_visual":
      return "campaign";
    case "exhibition_visual":
      return "exhibition";
    case "corporate_merch_visual":
      return "corporate_merch";
    case "support_visual":
    default:
      return "rich_content";
  }
}

function deriveUsageTarget(job: VisualProductionJob, role: VisualAssetRole): string {
  if (job.approvedUsages.length > 0) return job.approvedUsages.join(", ");
  switch (role) {
    case "wb_hero":
      return "wb_hero";
    case "ozon_hero":
      return "ozon_hero";
    case "rich_content":
      return "rich_content";
    case "reels":
      return "reels";
    case "campaign":
      return "campaign";
    case "exhibition":
      return "exhibition";
    case "corporate_merch":
      return "corporate_merch";
    case "detail_shot":
      return "detail_shot";
    case "size_grid":
      return "size_grid";
    default:
      return role;
  }
}

function defaultRefreshRecommendation(fatigueRisk: number | null): string {
  if (fatigueRisk !== null && fatigueRisk >= 4) {
    return "Elevated fatigue signal: plan hero refresh, simplify print plane, retest thumbnail crop.";
  }
  return "Monitor placement; refresh when corridor rules change or CTR softens (placeholder — no live marketplace data yet).";
}

function buildFatigue(job: VisualProductionJob, fatigueRiskTop: number | null): VisualAssetFatigueTracking {
  const fr = scoreOrNull(job.decisionScores.fatigueRisk) ?? fatigueRiskTop;
  return {
    visualAgeDays: 0,
    usageCount: 0,
    exposureNote: "",
    fatigueRiskScore: fr,
    refreshRecommendation: defaultRefreshRecommendation(fr),
  };
}

export type RegisterAssetContext = {
  collectionId: string;
  collectionName: string;
  promptPackId: string;
};

/** Maps an approved Visual Production job into a registry row (deterministic, no binary media). */
export function buildVisualAssetFromJob(job: VisualProductionJob, ctx: RegisterAssetContext): VisualAssetEntity {
  const now = Date.now();
  const ds = job.decisionScores;
  const brandFitScore = scoreOrNull(ds.brandFit);
  const marketplaceClarityScore = scoreOrNull(ds.marketplaceClarity);
  const printReadabilityScore = scoreOrNull(ds.printReadability);
  const premiumPerceptionScore = scoreOrNull(ds.premiumPerception);
  const fatigueRiskScore = scoreOrNull(ds.fatigueRisk);

  const assetRole = deriveAssetRole(job);
  const usageTarget = deriveUsageTarget(job, assetRole);
  const approvedUsage = job.approvedUsages.length > 0 ? job.approvedUsages.join(", ") : assetRole;

  const initialStatus: VisualAssetStatus = "active";

  return {
    id: newAssetId(),
    sourceJobId: job.id,
    promptPackId: ctx.promptPackId,
    collectionId: ctx.collectionId,
    collectionName: ctx.collectionName,
    title: job.title,
    assetRole,
    usageTarget,
    sourcePrompt: job.prompt,
    selectedResultNote: job.visualReviewNotes.selectedResultNote,
    approvedUsage,
    brandFitScore,
    marketplaceClarityScore,
    printReadabilityScore,
    premiumPerceptionScore,
    fatigueRiskScore,
    status: initialStatus,
    linkedSkuIds: [],
    linkedCardIds: [],
    linkedCampaignId: null,
    fatigue: buildFatigue(job, fatigueRiskScore),
    createdAt: now,
    updatedAt: now,
  };
}
