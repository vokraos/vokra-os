import type { CorridorSummaryRow } from "../entity-snapshot/intelligence";
import type { CorridorStrategyGlobalContext } from "./types";

export function computeSaturationPressure(
  row: CorridorSummaryRow,
  ctx: CorridorStrategyGlobalContext,
): number {
  if (!ctx.intel) return 0;
  const share = row.total / Math.max(1, ctx.maxCorridorTotal);
  let score = Math.min(50, share * 60);
  if (row.total >= 14) score += 22;
  else if (row.total >= 10) score += 12;
  const mixed = ctx.intel.fboExposureSummary.mixedCorridors.some((m) => m.corridor === row.corridor);
  if (mixed) score += 10;
  if (ctx.scalingReport.scalingMode === "hold_expansion") score += 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}
