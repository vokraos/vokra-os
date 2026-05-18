import type { UnitEconomicsResolvedMatch } from "../unit-economics/types";
import type { AdPressureGatherContext, AdPressureLevel } from "./types";
import { levelFromScore } from "./levels";

function n(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

export function computeLaunchAdScore(
  ctx: AdPressureGatherContext,
  resolved: UnitEconomicsResolvedMatch | null,
): number {
  const plan = ctx.econ.launchPlan;
  if (!plan) return ctx.econ.activeActionCount > 8 ? 22 : 0;

  let score = plan.launchPressure * 0.35;
  score += Math.min(20, plan.blockers.length * 4);
  score += Math.min(15, plan.operationalWarnings.length * 2);

  const waves = [plan.heroWave, plan.supportWave, plan.expansionWave].filter(
    (w) => w.status === "in_progress" || w.status === "ready",
  ).length;
  score += waves * 10;

  if (plan.launchReadiness === "fragile" || plan.launchReadiness === "blocked") score += 14;
  if (plan.fboPressure > 50) score += 12;

  if (resolved) {
    const ad = n(resolved.profile.adCostEstimate);
    const maxAd = n(resolved.calculated.maxAdCostBeforeTargetBreak);
    if (ad > maxAd) score += 28;
    else if (maxAd > 0 && ad > maxAd * 0.9) score += 16;
  }

  return Math.min(100, Math.round(score));
}

export function computeLaunchAdLevel(
  ctx: AdPressureGatherContext,
  resolved: UnitEconomicsResolvedMatch | null,
): AdPressureLevel {
  return levelFromScore(computeLaunchAdScore(ctx, resolved));
}

export function computeUnsafeAdSpendScore(resolved: UnitEconomicsResolvedMatch | null): number {
  if (!resolved) return 0;
  const ad = n(resolved.profile.adCostEstimate);
  const maxAd = n(resolved.calculated.maxAdCostBeforeTargetBreak);
  const sale = n(resolved.profile.salePrice);
  let score = 0;
  if (maxAd > 0 && ad > maxAd) score += 50 + Math.min(40, ((ad - maxAd) / maxAd) * 80);
  else if (maxAd > 0 && ad > maxAd * 0.92) score += 35;
  if (sale > 0 && ad / sale > 0.22) score += Math.min(25, (ad / sale) * 100);
  if (n(resolved.calculated.estimatedMarginPercent) < 0) score += 30;
  return Math.min(100, Math.round(score));
}

export function computeUnsafeAdSpendLevel(resolved: UnitEconomicsResolvedMatch | null): AdPressureLevel {
  return levelFromScore(computeUnsafeAdSpendScore(resolved));
}

export function computeExpansionAdScore(ctx: AdPressureGatherContext, resolved: UnitEconomicsResolvedMatch | null): number {
  const plan = ctx.econ.launchPlan;
  if (!plan) return 0;
  let score = 0;
  if (plan.expansionWave.status === "in_progress" || plan.expansionWave.status === "ready") score += 28;
  if (ctx.econ.executionPlan?.weekActions.length) {
    const expansionish = ctx.econ.executionPlan.weekActions.filter((a) =>
      /expand|fbo|launch|growth/i.test(a.actionType),
    ).length;
    score += Math.min(20, expansionish * 4);
  }
  if (resolved) {
    const margin = n(resolved.calculated.estimatedMarginPercent);
    const ad = n(resolved.profile.adCostEstimate);
    const maxAd = n(resolved.calculated.maxAdCostBeforeTargetBreak);
    if (margin < resolved.profile.targetMarginPercent - 3) score += 18;
    if (maxAd > 0 && ad > maxAd * 0.8) score += 22;
    if ((resolved.profile.stockMode ?? "").toLowerCase().includes("fbo")) score += 10;
  }
  return Math.min(100, Math.round(score));
}

export function computeExpansionAdLevel(
  ctx: AdPressureGatherContext,
  resolved: UnitEconomicsResolvedMatch | null,
): AdPressureLevel {
  return levelFromScore(computeExpansionAdScore(ctx, resolved));
}
