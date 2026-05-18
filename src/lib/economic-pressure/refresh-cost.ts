import type { EconomicPressureGatherContext } from "./types";

export function computeRefreshPressure(ctx: EconomicPressureGatherContext): number {
  let score = ctx.visualFatigueHint * 0.5 + ctx.seoSaturationHint * 0.25;
  const hf = ctx.heroFatigue;
  if (hf) {
    score = Math.max(score, hf.fatiguePressureIndex);
    if (/high|сроч|urgent|elevated/i.test(hf.refreshUrgencyLine)) score += 12;
    if (hf.ourFatigueEntity?.fatigueLevel === "exhausted" || hf.ourFatigueEntity?.fatigueLevel === "fatigued") {
      score += 15;
    }
  }
  if (ctx.snapshot) {
    const refreshCandidates = ctx.snapshot.skuEntities.filter((s) => s.refreshCandidate).length;
    score += Math.min(20, refreshCandidates * 2);
    score += Math.min(15, ctx.intel?.refreshCandidateSummary.weakSkuCount ?? 0);
  }
  if (ctx.launchPlan?.archiveRefreshWave.status === "ready") score += 8;
  return Math.min(100, Math.round(score));
}
