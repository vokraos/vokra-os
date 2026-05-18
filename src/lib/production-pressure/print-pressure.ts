import type { ProductionPressureGatherContext } from "./types";
import type { PressureScore } from "./types";
import { scoreToBand } from "./levels";

export function derivePrintPressure(ctx: ProductionPressureGatherContext): PressureScore {
  let score = ctx.orchestrationDtf;
  score += Math.min(35, ctx.visualQueueCount * 7);
  score += Math.min(25, ctx.refreshActionCount * 5);
  if (ctx.launchPlan?.heroWave.status === "in_progress") score += 12;
  if (!ctx.snapshotId) score += 15;
  score = Math.min(100, Math.round(score));

  const band = scoreToBand(score);
  let summaryKey = "prod.print.summary.low";
  if (band === "critical") summaryKey = "prod.print.summary.critical";
  else if (band === "high") summaryKey = "prod.print.summary.high";
  else if (band === "moderate") summaryKey = "prod.print.summary.moderate";

  return {
    score,
    band,
    summaryKey,
    summaryVars: { n: String(ctx.visualQueueCount), refresh: String(ctx.refreshActionCount) },
  };
}
