import type { CorridorSummaryRow } from "../entity-snapshot/intelligence";
import type { CorridorStrategyGlobalContext } from "./types";

export function computeFulfillmentFit(
  row: CorridorSummaryRow,
  ctx: CorridorStrategyGlobalContext,
): number {
  let score = 55;
  const fbo = ctx.fboReport;
  if (row.corridor === fbo.corridor) {
    const ranks: Record<string, number> = { blocked: 10, fragile: 30, fair: 50, good: 75, strong: 95 };
    score = ranks[fbo.economicsFit] ?? 50;
    if (fbo.recommendedMode === "move_to_fbo") score += 8;
    if (fbo.recommendedMode === "stop_fbo_expansion") score -= 30;
    if (fbo.recommendedMode === "keep_fbs") score -= 15;
  } else {
    const mixed = ctx.intel?.fboExposureSummary.mixedCorridors.find((m) => m.corridor === row.corridor);
    if (mixed?.hasFbo && mixed.hasFbs) score = 45;
    else if (mixed?.hasFbo) score = 62;
    else score = 68;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}
