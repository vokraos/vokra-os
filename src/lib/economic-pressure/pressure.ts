import type { EconomicPressureGatherContext, EconomicPressureLevel } from "./types";

export function levelFromScore(score: number): EconomicPressureLevel {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s < 25) return "low";
  if (s < 45) return "manageable";
  if (s < 65) return "elevated";
  if (s < 80) return "dangerous";
  return "critical";
}

export function computeOperationalPressure(ctx: EconomicPressureGatherContext): number {
  if (!ctx.snapshot || !ctx.intel) return 0;
  const m = ctx.intel.missingFieldSummary;
  const actionable = ctx.activeActionCount;
  const hold = ctx.executionPlan?.holdActions.length ?? 0;
  const blockers = ctx.launchPlan?.blockers.length ?? 0;

  let score = Math.min(40, m.totalSlots * 2);
  score += Math.min(25, actionable * 1.2);
  score += Math.min(20, hold * 4);
  score += Math.min(25, blockers * 5);
  if (ctx.executionPlan?.warnings.length) score += Math.min(15, ctx.executionPlan.warnings.length * 3);

  return Math.min(100, Math.round(score));
}

export function computeSaturationPressure(ctx: EconomicPressureGatherContext): number {
  let score = ctx.visualFatigueHint * 0.45 + ctx.seoSaturationHint * 0.35;
  if (ctx.heroFatigue) score = Math.max(score, ctx.heroFatigue.fatiguePressureIndex * 0.85);
  if (ctx.launchPlan && ctx.launchPlan.saturationRisk) {
    if (/high|высок/i.test(ctx.launchPlan.saturationRisk)) score += 12;
  }
  return Math.min(100, Math.round(score));
}
