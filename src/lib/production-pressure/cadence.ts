import type { ProductionPressureGatherContext, PressureScore } from "./types";
import { scoreToBand } from "./levels";

export function deriveCadenceStability(ctx: ProductionPressureGatherContext): PressureScore {
  let instability = 0;
  if (ctx.overlappingWaves) instability += 35;
  if (ctx.activeWaveCount >= 3) instability += 20;
  if (ctx.feedbackSignals.delayedCount >= 2) instability += 15;
  if (ctx.scalingSignals?.scalingMode === "refresh_only") instability += 10;
  if (ctx.launchPlan?.archiveRefreshWave.status === "in_progress") instability += 12;

  const score = Math.min(100, instability);
  const band = scoreToBand(score);
  let summaryKey = "prod.cadence.summary.stable";
  if (band === "critical") summaryKey = "prod.cadence.summary.critical";
  else if (band === "high") summaryKey = "prod.cadence.summary.unstable";
  else if (band === "moderate") summaryKey = "prod.cadence.summary.wobbly";

  return {
    score,
    band,
    summaryKey,
    summaryVars: { waves: String(ctx.activeWaveCount) },
  };
}

export function deriveWaveCollisionRisk(ctx: ProductionPressureGatherContext): PressureScore {
  let score = 0;
  if (ctx.overlappingWaves) score += 55;
  if (ctx.refreshActionCount >= 2 && ctx.launchActionCount >= 1) score += 25;
  if (ctx.launchPlan?.heroWave.status === "in_progress" && ctx.launchPlan.archiveRefreshWave.status !== "pending") {
    score += 20;
  }
  score = Math.min(100, Math.round(score));

  const band = scoreToBand(score);
  let summaryKey = "prod.collision.summary.none";
  if (band === "critical") summaryKey = "prod.collision.summary.critical";
  else if (band === "high") summaryKey = "prod.collision.summary.high";
  else if (band === "moderate") summaryKey = "prod.collision.summary.moderate";

  return {
    score,
    band,
    summaryKey,
    summaryVars: {},
  };
}
