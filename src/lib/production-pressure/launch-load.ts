import type { ProductionPressureGatherContext, PressureScore } from "./types";
import { scoreToBand } from "./levels";

export function deriveLaunchLoad(ctx: ProductionPressureGatherContext): PressureScore {
  let score = ctx.launchPressure;
  score += Math.min(30, ctx.launchActionCount * 6);
  score += Math.min(25, ctx.activeWaveCount * 10);
  score += Math.min(20, ctx.todayActionCount * 2);
  if (ctx.launchPlan?.launchReadiness === "fragile") score += 10;
  if (ctx.launchPlan?.launchReadiness === "blocked") score += 20;
  score = Math.min(100, Math.round(score));

  const band = scoreToBand(score);
  let summaryKey = "prod.launch.summary.low";
  if (band === "critical") summaryKey = "prod.launch.summary.critical";
  else if (band === "high") summaryKey = "prod.launch.summary.high";
  else if (band === "moderate") summaryKey = "prod.launch.summary.moderate";

  return {
    score,
    band,
    summaryKey,
    summaryVars: { waves: String(ctx.activeWaveCount), actions: String(ctx.launchActionCount) },
  };
}
