import type { UnitEconomicsResolvedMatch } from "../unit-economics/types";
import type { AdPressureGatherContext, AdPressureLevel } from "./types";
import { levelFromScore } from "./levels";

function n(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

export function computeAdDependencyScore(
  resolved: UnitEconomicsResolvedMatch | null,
  ctx: AdPressureGatherContext,
): number {
  if (!resolved) {
    return ctx.econ.launchPlan ? 32 : 12;
  }
  const { profile, calculated } = resolved;
  const sale = n(profile.salePrice);
  const ad = n(profile.adCostEstimate);
  const maxAd = n(calculated.maxAdCostBeforeTargetBreak);
  const margin = n(calculated.estimatedMarginPercent);

  let score = 0;
  if (sale > 0) score += Math.min(35, (ad / sale) * 100 * 0.45);
  if (maxAd > 0 && ad > maxAd) score += Math.min(40, ((ad - maxAd) / maxAd) * 100);
  else if (maxAd > 0 && ad > maxAd * 0.85) score += 18;
  if (margin < profile.targetMarginPercent - 4) score += 15;
  if (margin < 0) score += 25;
  if ((profile.stockMode ?? "").toLowerCase().includes("fbo") || profile.fboCost > 0) score += 8;

  return Math.min(100, Math.round(score));
}

export function computeAdDependencyLevel(
  resolved: UnitEconomicsResolvedMatch | null,
  ctx: AdPressureGatherContext,
): AdPressureLevel {
  return levelFromScore(computeAdDependencyScore(resolved, ctx));
}

export function computeHeroAdDependency(
  resolved: UnitEconomicsResolvedMatch | null,
  ctx: AdPressureGatherContext,
): AdPressureLevel {
  const hf = ctx.econ.heroFatigue;
  let score = 0;
  if (hf) {
    score += hf.fatiguePressureIndex * 0.55;
    if (/high|сроч|urgent|elevated/i.test(hf.refreshUrgencyLine)) score += 14;
    if (hf.ourFatigueEntity?.fatigueLevel === "exhausted") score += 22;
    else if (hf.ourFatigueEntity?.fatigueLevel === "fatigued") score += 14;
  }
  if (ctx.econ.launchPlan?.heroWave.status === "in_progress") score += 12;
  if (resolved) {
    const ad = n(resolved.profile.adCostEstimate);
    const maxAd = n(resolved.calculated.maxAdCostBeforeTargetBreak);
    if (maxAd > 0 && ad >= maxAd * 0.75) score += 20;
    if (n(resolved.calculated.estimatedMarginPercent) < resolved.profile.targetMarginPercent) score += 10;
  }
  return levelFromScore(score);
}
