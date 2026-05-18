import type { ProductionPressureGatherContext, PressureScore } from "./types";
import { scoreToBand } from "./levels";

export function derivePackagingPressure(ctx: ProductionPressureGatherContext): PressureScore {
  let score = ctx.orchestrationPackaging;
  score += Math.min(30, ctx.cardDraftCount * 8);
  score += Math.min(20, ctx.todayActionCount * 2);
  if (ctx.launchPlan && ctx.fboPressure >= 55) score += 10;
  score = Math.min(100, Math.round(score));

  const band = scoreToBand(score);
  let summaryKey = "prod.pack.summary.low";
  if (band === "critical") summaryKey = "prod.pack.summary.critical";
  else if (band === "high") summaryKey = "prod.pack.summary.high";
  else if (band === "moderate") summaryKey = "prod.pack.summary.moderate";

  return {
    score,
    band,
    summaryKey,
    summaryVars: { cards: String(ctx.cardDraftCount), today: String(ctx.todayActionCount) },
  };
}
