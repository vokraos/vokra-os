import type { CorridorSummaryRow } from "../entity-snapshot/intelligence";
import type { CorridorStrategyGlobalContext } from "./types";

export function computeExpansionSafety(
  row: CorridorSummaryRow,
  ctx: CorridorStrategyGlobalContext,
): number {
  let score = 50;
  if (ctx.scalingReport.safetyLevel === "safe") score += 28;
  else if (ctx.scalingReport.safetyLevel === "cautious") score += 12;
  else if (ctx.scalingReport.safetyLevel === "fragile") score -= 10;
  else score -= 28;
  if (ctx.fboReport.recommendedMode === "move_to_fbo" || ctx.fboReport.recommendedMode === "test_fbo_small") {
    score += 10;
  }
  if (ctx.fboReport.recommendedMode === "stop_fbo_expansion" || ctx.fboReport.recommendedMode === "cleanup_before_fbo") {
    score -= 22;
  }
  if (row.corridor === ctx.fboReport.corridor || row.corridor === ctx.scalingReport.corridor) {
    score += ctx.fboReport.readiness === "expansion_ready" ? 15 : 0;
  }
  const mixed = ctx.intel?.fboExposureSummary.mixedCorridors.some((m) => m.corridor === row.corridor);
  if (mixed) score -= 12;
  return Math.max(0, Math.min(100, Math.round(score)));
}
