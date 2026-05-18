import type { CorridorStrategyReport } from "../corridor-strategy/types";

export function computeRefreshDueScore(args: {
  cst: CorridorStrategyReport | null;
  refreshCadenceScore: number;
  cardsNeedingRefresh: number;
  corridorSkuTotal: number;
}): number {
  let score = args.refreshCadenceScore * 0.5;
  if (args.cst?.corridorState === "refresh_needed") score += 35;
  if (args.cst?.recommendedStrategy === "refresh") score += 22;
  if (args.corridorSkuTotal > 0) {
    const ratio = args.cardsNeedingRefresh / args.corridorSkuTotal;
    score += Math.min(30, ratio * 80);
  }
  return Math.round(Math.min(100, score));
}

export function refreshTimingLabelKey(score: number): string {
  if (score >= 72) return "mtm.refresh.dueNow";
  if (score >= 52) return "mtm.refresh.dueSoon";
  if (score >= 35) return "mtm.refresh.watch";
  return "mtm.refresh.stable";
}
