import type { ProductionPressureGatherContext, PressureScore } from "./types";
import { scoreToBand } from "./levels";

export function deriveFulfillmentPressure(ctx: ProductionPressureGatherContext): PressureScore {
  let score = Math.round(ctx.fboPressure * 0.55 + ctx.fbsPressure * 0.35);
  const fboPrep =
    ctx.executionPlan?.todayActions.filter((a) => a.actionType === "prepare_fbo").length ?? 0;
  score += Math.min(25, fboPrep * 8);
  if (ctx.fboSignals?.recommendedMode === "stop_fbo_expansion") score += 15;
  if (ctx.launchPlan?.launchReadiness === "blocked") score += 12;
  score = Math.min(100, Math.round(score));

  const band = scoreToBand(score);
  let summaryKey = "prod.fulfill.summary.low";
  if (band === "critical") summaryKey = "prod.fulfill.summary.critical";
  else if (band === "high") summaryKey = "prod.fulfill.summary.high";
  else if (band === "moderate") summaryKey = "prod.fulfill.summary.moderate";

  return {
    score,
    band,
    summaryKey,
    summaryVars: { fbo: String(ctx.fboPressure), fbs: String(ctx.fbsPressure) },
  };
}
