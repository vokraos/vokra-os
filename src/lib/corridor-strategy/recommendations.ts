import type { CorridorSummaryRow } from "../entity-snapshot/intelligence";
import type {
  CorridorRecommendedStrategy,
  CorridorState,
  CorridorStrategyGlobalContext,
  CorridorStrategyReport,
} from "./types";
import { newCorridorStrategyReportId } from "./levels";
import { computeDominancePotential } from "./dominance";
import { computeSaturationPressure } from "./saturation";
import { computeFragmentationPressure, computeSeoCoverage } from "./fragmentation";
import { computeExpansionSafety } from "./expansion";
import {
  computeArchiveRisk,
  computeHeroPressure,
  computeOperationalBurden,
  computeRefreshNeed,
} from "./fatigue";
import { computeFulfillmentFit } from "./fulfillment";

export function deriveCorridorState(args: {
  dominance: number;
  saturation: number;
  fragmentation: number;
  refreshNeed: number;
  archiveRisk: number;
  expansionSafety: number;
  row: CorridorSummaryRow;
  ctx: CorridorStrategyGlobalContext;
}): CorridorState {
  const { dominance, saturation, fragmentation, refreshNeed, archiveRisk, expansionSafety, row, ctx } = args;
  if (archiveRisk >= 65) return "archive_candidate";
  if (refreshNeed >= 58) return "refresh_needed";
  if (fragmentation >= 55) return "fragmented";
  if (saturation >= 72) return "overloaded";
  if (expansionSafety < 35 || ctx.scalingReport.safetyLevel === "blocked") return "unstable";
  if (row.total <= 3 && ctx.intel && ctx.intel.corridorSummary.length >= 4) return "emerging";
  if (dominance >= 55 && expansionSafety >= 55) return "scalable";
  if (saturation >= 50) return "overloaded";
  return "emerging";
}

export function deriveRecommendedStrategy(
  state: CorridorState,
  args: {
    dominance: number;
    saturation: number;
    fragmentation: number;
    refreshNeed: number;
    expansionSafety: number;
    fulfillmentFit: number;
    seoCoverage: number;
    ctx: CorridorStrategyGlobalContext;
  },
): CorridorRecommendedStrategy {
  const { dominance, saturation, fragmentation, refreshNeed, expansionSafety, fulfillmentFit, seoCoverage, ctx } =
    args;
  if (state === "archive_candidate") return "archive";
  if (state === "refresh_needed") return "refresh";
  if (state === "fragmented") return seoCoverage < 45 ? "consolidate" : "rebuild";
  if (state === "unstable") return "reduce";
  if (state === "overloaded") return saturation > 80 ? "reduce" : "scale_carefully";
  if (state === "emerging") return dominance >= 40 ? "scale_carefully" : "consolidate";
  if (state === "scalable") {
    if (ctx.scalingReport.safetyLevel === "safe" && expansionSafety >= 65 && fulfillmentFit >= 60) return "dominate";
    return "scale_carefully";
  }
  if (refreshNeed > 50) return "refresh";
  if (fragmentation > 50) return "consolidate";
  return "scale_carefully";
}

export function buildCorridorStrategyReport(
  row: CorridorSummaryRow,
  ctx: CorridorStrategyGlobalContext,
  existingId?: string,
): CorridorStrategyReport {
  const dominancePotential = computeDominancePotential(row, ctx);
  const saturationPressure = computeSaturationPressure(row, ctx);
  const fragmentationPressure = computeFragmentationPressure(row, ctx);
  const expansionSafety = computeExpansionSafety(row, ctx);
  const fulfillmentFit = computeFulfillmentFit(row, ctx);
  const refreshNeed = computeRefreshNeed(row, ctx);
  const archiveRisk = computeArchiveRisk(row, ctx);
  const seoCoverage = computeSeoCoverage(row, ctx);
  const heroPressure = computeHeroPressure(row, ctx);
  const operationalBurden = computeOperationalBurden(row, ctx);

  const corridorState = deriveCorridorState({
    dominance: dominancePotential,
    saturation: saturationPressure,
    fragmentation: fragmentationPressure,
    refreshNeed,
    archiveRisk,
    expansionSafety,
    row,
    ctx,
  });

  const recommendedStrategy = deriveRecommendedStrategy(corridorState, {
    dominance: dominancePotential,
    saturation: saturationPressure,
    fragmentation: fragmentationPressure,
    refreshNeed,
    expansionSafety,
    fulfillmentFit,
    seoCoverage,
    ctx,
  });

  const vars: Record<string, string> = {
    corridor: row.corridor,
    marketplace: ctx.marketplace,
    total: String(row.total),
    state: corridorState,
    strategy: recommendedStrategy,
  };

  const forbiddenMoveKeys: string[] = [];
  const recommendedMoveKeys: string[] = [];

  if (recommendedStrategy === "dominate" || recommendedStrategy === "scale_carefully") {
    recommendedMoveKeys.push("cst.move.controlledExpansion", "cst.move.heroFocus");
    if (recommendedStrategy === "dominate") recommendedMoveKeys.push("cst.move.corridorLead");
    forbiddenMoveKeys.push("cst.forbid.scatterSkus");
  } else if (recommendedStrategy === "refresh") {
    recommendedMoveKeys.push("cst.move.refreshCadence", "cst.move.visualPass");
    forbiddenMoveKeys.push("cst.forbid.expansionWave");
  } else if (recommendedStrategy === "consolidate" || recommendedStrategy === "rebuild") {
    recommendedMoveKeys.push("cst.move.mergeSkus", "cst.move.seoCluster");
    forbiddenMoveKeys.push("cst.forbid.newSkus", "cst.forbid.fboScale");
  } else if (recommendedStrategy === "reduce" || recommendedStrategy === "archive") {
    recommendedMoveKeys.push("cst.move.trimAssortment");
    forbiddenMoveKeys.push("cst.forbid.expansion", "cst.forbid.launchWave");
  } else {
    recommendedMoveKeys.push("cst.move.reviewCorridor");
  }

  if (expansionSafety < 40) forbiddenMoveKeys.push("cst.forbid.unsafeExpansion");
  if (fulfillmentFit < 40) forbiddenMoveKeys.push("cst.forbid.fboPush");

  let strategyReasonKey = "cst.reason.default";
  if (recommendedStrategy === "dominate") strategyReasonKey = "cst.reason.dominate";
  else if (recommendedStrategy === "scale_carefully") strategyReasonKey = "cst.reason.scaleCarefully";
  else if (recommendedStrategy === "refresh") strategyReasonKey = "cst.reason.refresh";
  else if (recommendedStrategy === "consolidate") strategyReasonKey = "cst.reason.consolidate";
  else if (recommendedStrategy === "reduce") strategyReasonKey = "cst.reason.reduce";
  else if (recommendedStrategy === "archive") strategyReasonKey = "cst.reason.archive";
  else if (recommendedStrategy === "rebuild") strategyReasonKey = "cst.reason.rebuild";

  return {
    id: existingId ?? newCorridorStrategyReportId(row.corridor),
    createdAt: Date.now(),
    corridor: row.corridor,
    marketplace: ctx.marketplace,
    corridorState,
    dominancePotential,
    saturationPressure,
    fragmentationPressure,
    expansionSafety,
    fulfillmentFit,
    refreshNeed,
    archiveRisk,
    seoCoverage,
    heroPressure,
    operationalBurden,
    recommendedStrategy,
    forbiddenMoveKeys: [...new Set(forbiddenMoveKeys)].slice(0, 6),
    recommendedMoveKeys: [...new Set(recommendedMoveKeys)].slice(0, 6),
    confidenceNoteKey: "cst.confidence.manual",
    strategyReasonKey,
    strategyReasonVars: vars,
  };
}

export function buildAllCorridorStrategyReports(ctx: CorridorStrategyGlobalContext): CorridorStrategyReport[] {
  if (!ctx.intel) return [];
  return ctx.intel.corridorSummary
    .filter((r) => r.corridor && r.corridor !== "—" && r.total > 0)
    .slice(0, 16)
    .map((row) => buildCorridorStrategyReport(row, ctx));
}

export function pickPrimaryCorridorReport(reports: CorridorStrategyReport[]): CorridorStrategyReport | null {
  if (!reports.length) return null;
  const stratRank = (s: CorridorRecommendedStrategy) => {
    if (s === "reduce" || s === "archive") return 5;
    if (s === "consolidate" || s === "rebuild") return 4;
    if (s === "refresh") return 3;
    if (s === "scale_carefully") return 2;
    return 1;
  };
  const urgent = reports.find(
    (r) =>
      r.corridorState === "fragmented" ||
      r.corridorState === "refresh_needed" ||
      r.corridorState === "unstable" ||
      r.recommendedStrategy === "reduce",
  );
  if (urgent) return urgent;
  return [...reports].sort(
    (a, b) =>
      stratRank(b.recommendedStrategy) - stratRank(a.recommendedStrategy) ||
      b.operationalBurden - a.operationalBurden,
  )[0]!;
}
