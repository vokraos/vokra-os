import type { AdPressureGatherContext, AdPressureLevel } from "./types";
import { levelFromScore } from "./levels";

export function computeRefreshAdScore(ctx: AdPressureGatherContext): number {
  const econ = ctx.econ;
  let score = econ.visualFatigueHint * 0.5;

  if (econ.heroFatigue) {
    score = Math.max(score, econ.heroFatigue.fatiguePressureIndex * 0.65);
    if (/refresh|обнов/i.test(econ.heroFatigue.refreshUrgencyLine)) score += 12;
  }

  if (econ.snapshot) {
    const refreshCandidates = econ.snapshot.skuEntities.filter((s) => s.refreshCandidate).length;
    score += Math.min(22, refreshCandidates * 2.5);
  }

  if (econ.launchPlan?.archiveRefreshWave.status === "ready" || econ.launchPlan?.archiveRefreshWave.status === "in_progress") {
    score += 14;
  }

  if (econ.intel?.refreshCandidateSummary.weakSkuCount) {
    score += Math.min(15, econ.intel.refreshCandidateSummary.weakSkuCount * 1.5);
  }

  return Math.min(100, Math.round(score));
}

export function computeRefreshAdLevel(ctx: AdPressureGatherContext): AdPressureLevel {
  return levelFromScore(computeRefreshAdScore(ctx));
}
