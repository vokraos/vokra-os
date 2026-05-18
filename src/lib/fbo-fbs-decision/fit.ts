import { hasGuardrailType } from "../economic-guardrails/match";
import type { FboFbsDecisionGatherContext } from "./types";
import { fitFromScore } from "./levels";
import type { FboFitLevel } from "./types";

function rankEcon(level: string): number {
  if (level === "critical") return 5;
  if (level === "dangerous") return 4;
  if (level === "elevated") return 3;
  if (level === "manageable") return 2;
  return 1;
}

function rankPrice(level: string): number {
  if (level === "negative") return 5;
  if (level === "dangerous") return 4;
  if (level === "tight") return 3;
  if (level === "watch") return 2;
  return 1;
}

export function computeEconomicsFit(ctx: FboFbsDecisionGatherContext): FboFitLevel {
  let score = 55;
  const ue = ctx.launchEconFbo;
  if (ue) {
    const margin = ue.calculated.estimatedMarginPercent;
    const target = ue.profile.targetMarginPercent;
    if (margin >= target) score += 22;
    else if (margin >= target - 4) score += 10;
    else if (margin < 0) score -= 35;
    else score -= 12;
    const ad = ue.profile.adCostEstimate;
    const maxAd = ue.calculated.maxAdCostBeforeTargetBreak;
    if (ad > maxAd) score -= 25;
    else if (ad > maxAd * 0.9) score -= 12;
    if (ue.profile.fboCost > 0) score += 5;
  } else {
    score -= 20;
  }
  const ppr = ctx.priceReport;
  if (ppr) score -= rankPrice(ppr.pricePressureLevel) * 8;
  if (rankEcon(ctx.econReport.warehouseLevel) >= 4) score -= 15;
  if (hasGuardrailType(ctx.guardrails, ["avoid_fbo_scaling", "require_cost_review"], "caution")) score -= 22;
  return fitFromScore(score);
}

export function computeLaunchFit(ctx: FboFbsDecisionGatherContext): FboFitLevel {
  const plan = ctx.launchPlan;
  if (!plan) return fitFromScore(35);
  let score = plan.launchReadinessScore * 0.65;
  if (plan.launchReadiness === "expansion_ready" || plan.launchReadiness === "ready") score += 18;
  if (plan.launchReadiness === "blocked" || plan.launchReadiness === "fragile") score -= 22;
  if (plan.blockers.length) score -= Math.min(20, plan.blockers.length * 4);
  if (plan.fboPressure > 55) score -= 10;
  return fitFromScore(score);
}

export function computeSeoFit(ctx: FboFbsDecisionGatherContext): FboFitLevel {
  const intel = ctx.econCtx.intel;
  if (!intel) return fitFromScore(15);
  let score = 70;
  const seo = intel.seoGapSummary;
  score -= Math.min(40, seo.cardsMissingSeo * 2);
  score -= Math.min(15, seo.skusInCorridorsWithoutSeoSignal);
  const ms = intel.missingFieldSummary;
  score -= Math.min(25, ms.totalSlots);
  return fitFromScore(score);
}

export function computeVisualContentFit(ctx: FboFbsDecisionGatherContext): FboFitLevel {
  const intel = ctx.econCtx.intel;
  const hf = ctx.econCtx.heroFatigue;
  if (!intel) return fitFromScore(20);
  let score = 62;
  score -= Math.min(25, intel.refreshCandidateSummary.weakSkuCount * 2);
  score -= Math.min(15, intel.refreshCandidateSummary.thinTitleCardCount);
  if (hf) {
    score -= Math.min(30, hf.fatiguePressureIndex * 0.35);
    if (hf.ourFatigueEntity?.fatigueLevel === "exhausted") score -= 20;
  }
  const refreshCandidates = ctx.econCtx.snapshot?.skuEntities.filter((s) => s.refreshCandidate).length ?? 0;
  score -= Math.min(15, refreshCandidates * 2);
  return fitFromScore(score);
}

export function computeOperationalFit(ctx: FboFbsDecisionGatherContext): FboFitLevel {
  const intel = ctx.econCtx.intel;
  if (!intel) return fitFromScore(18);
  let score = 58;
  const fbo = intel.fboExposureSummary;
  if (fbo.mixedCorridors.length >= 2) score -= 12;
  if (fbo.ambiguousOrEmpty > 5) score -= 15;
  score -= Math.min(20, ctx.econReport.fragmentationPressure * 0.2);
  score -= Math.min(15, ctx.econReport.assortmentComplexity * 0.12);
  const cleanupHold = ctx.executionPlan?.holdActions.filter((a) =>
    a.executiveQueues.includes("requires_cleanup"),
  ).length;
  score -= Math.min(18, (cleanupHold ?? 0) * 4);
  if (ctx.scalingReport.safetyLevel === "blocked" || ctx.scalingReport.safetyLevel === "unsafe") score -= 25;
  return fitFromScore(score);
}
