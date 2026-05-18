import type { AdPressureGatherContext, AdPressureLevel } from "./types";
import { levelFromScore } from "./levels";

export function computeSaturationAdScore(ctx: AdPressureGatherContext): number {
  const econ = ctx.econ;
  let score = econ.visualFatigueHint * 0.4 + econ.seoSaturationHint * 0.35;

  if (econ.intel) {
    const corridors = econ.intel.corridorSummary.length;
    score += Math.min(22, corridors * 3);
    const dense = econ.intel.corridorSummary.filter((c) => c.total >= 12).length;
    score += Math.min(18, dense * 5);
  }

  if (econ.launchPlan?.saturationRisk && /high|высок|heavy|плотн/i.test(econ.launchPlan.saturationRisk)) {
    score += 16;
  }

  if (econ.launchPlan?.supportWave.status === "in_progress" || econ.launchPlan?.supportWave.status === "ready") {
    score += 12;
  }
  if (econ.actionCount > 20) score += Math.min(12, (econ.actionCount - 20) * 0.5);

  return Math.min(100, Math.round(score));
}

export function computeSaturationAdLevel(ctx: AdPressureGatherContext): AdPressureLevel {
  return levelFromScore(computeSaturationAdScore(ctx));
}
