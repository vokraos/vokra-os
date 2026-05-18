import type { CorridorSummaryRow } from "../entity-snapshot/intelligence";
import type { CorridorStrategyGlobalContext } from "./types";

export function computeDominancePotential(
  row: CorridorSummaryRow,
  ctx: CorridorStrategyGlobalContext,
): number {
  if (!ctx.intel || row.corridor === "—") return 0;
  const share = row.total / Math.max(1, ctx.maxCorridorTotal);
  let score = Math.min(45, share * 55);
  if (row.total >= 8) score += 15;
  if (ctx.scalingReport.safetyLevel === "safe") score += 18;
  else if (ctx.scalingReport.safetyLevel === "cautious") score += 8;
  if (ctx.fboReport.readiness === "ready" || ctx.fboReport.readiness === "expansion_ready") score += 12;
  const launchCorridor = ctx.intel.launchCandidateSummary.byCorridor.find((c) => c.corridor === row.corridor);
  if (launchCorridor && launchCorridor.count >= 2) score += 10;
  if (ctx.scalingReport.safetyLevel === "blocked" || ctx.scalingReport.safetyLevel === "unsafe") score -= 25;
  return Math.max(0, Math.min(100, Math.round(score)));
}
