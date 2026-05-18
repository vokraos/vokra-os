import type { CorridorSummaryRow } from "../entity-snapshot/intelligence";
import { computeLaunchCadencePressure, computeOperationalRhythm, computeRefreshCadencePressure } from "./cadence";
import { computeBurnoutRisk, isBurnoutRisk } from "./burnout";
import { computeOverlapPressure, hasOverlappingLaunches } from "./overlap";
import { computeRefreshDueScore, refreshTimingLabelKey } from "./refresh";
import { computeSpacingQuality, launchTimingLabelKey } from "./spacing";
import { deriveSeasonalContext } from "./seasonality";
import { newMarketTimingReportId } from "./levels";
import type {
  CadenceLevel,
  MarketTimingGlobalContext,
  MarketTimingReport,
  TimingState,
} from "./types";

function deriveTimingState(args: {
  overlapPressure: number;
  burnoutRisk: number;
  refreshDueScore: number;
  spacingQuality: number;
  launchCadence: CadenceLevel;
  operationalRhythm: CadenceLevel;
  overlapping: boolean;
  scalingBlocked: boolean;
}): TimingState {
  if (args.scalingBlocked && args.launchCadence !== "slow") return "unstable";
  if (args.burnoutRisk >= 62 || (args.burnoutRisk >= 50 && args.refreshDueScore >= 50)) return "burnout_risk";
  if (args.overlapping || args.overlapPressure >= 58) return "overlapping";
  if (args.refreshDueScore >= 58) return "refresh_due";
  if (args.overlapPressure >= 42 || args.launchCadence === "overloaded" || args.launchCadence === "chaotic") {
    return "crowded";
  }
  if (
    args.spacingQuality >= 62 &&
    args.operationalRhythm !== "chaotic" &&
    args.operationalRhythm !== "overloaded"
  ) {
    return "well_spaced";
  }
  if (args.operationalRhythm === "chaotic" || args.operationalRhythm === "overloaded") return "unstable";
  return args.refreshDueScore >= 40 ? "refresh_due" : "crowded";
}

function deriveRecommendedCadence(
  launchCadence: CadenceLevel,
  refreshCadence: CadenceLevel,
  operationalRhythm: CadenceLevel,
): CadenceLevel {
  const ranks = [launchCadence, refreshCadence, operationalRhythm].map((c) => {
    if (c === "chaotic") return 5;
    if (c === "overloaded") return 4;
    if (c === "accelerated") return 3;
    if (c === "stable") return 2;
    return 1;
  });
  const max = Math.max(...ranks);
  if (max >= 5) return "chaotic";
  if (max >= 4) return "overloaded";
  if (max >= 3) return "accelerated";
  if (max <= 1 && ranks.every((r) => r <= 2)) return "slow";
  return "stable";
}

export function buildMarketTimingReport(
  row: CorridorSummaryRow,
  ctx: MarketTimingGlobalContext,
  existingId?: string,
): MarketTimingReport {
  const corridor = row.corridor;
  const cst = ctx.corridorReports.find((r) => r.corridor === corridor) ?? null;
  const corridorWaves = ctx.waves.filter((w) => w.corridor === corridor);
  const corridorReviews = ctx.launchReviews.filter(
    (r) =>
      r.collectionName.toLowerCase().includes(corridor.toLowerCase().slice(0, 12)) ||
      ctx.launchPlan?.collectionName.toLowerCase().includes(corridor.toLowerCase().slice(0, 8)),
  );
  const corridorLaunchActions = ctx.launchExecutionActions.filter(
    (a) => a.linkedCorridor === corridor || a.linkedCorridor === "—",
  );
  const refreshActions = corridorLaunchActions.filter(
    (a) => a.sourceStage === "refresh_wave" || /refresh/i.test(a.title),
  );

  const cardsNeedingRefresh = ctx.snapshot
    ? ctx.snapshot.cardEntities.filter(
        (c) =>
          (c.corridor || "—").trim() === corridor.trim() &&
          (c.refreshCandidate || c.missingSeo || c.missingHero || !c.cardTitle?.trim()),
      ).length
    : 0;

  const launchCadence = computeLaunchCadencePressure({
    activeWaves: corridorWaves,
    launchActions: corridorLaunchActions.filter((a) => a.status !== "done").length,
    scalingBlocked: ctx.scalingReport.safetyLevel === "blocked",
  });
  const refreshCadence = computeRefreshCadencePressure({
    refreshNeed: cst?.refreshNeed ?? 0,
    heroFatigueIdx: ctx.heroFatigue?.fatiguePressureIndex ?? 0,
    refreshActions: refreshActions.length,
    cstRefresh: cst?.recommendedStrategy === "refresh" || cst?.corridorState === "refresh_needed",
  });
  const overlapPressure = computeOverlapPressure(corridorWaves);
  const burnoutRisk = computeBurnoutRisk({
    heroFatigue: ctx.heroFatigue,
    recentRefreshActions: refreshActions,
    visualFatigueHint: ctx.heroFatigue?.fatiguePressureIndex ?? 0,
  });
  const spacingQuality = computeSpacingQuality({
    waves: corridorWaves,
    reviews: corridorReviews.length ? corridorReviews : ctx.launchReviews.slice(0, 3),
    corridorSkuTotal: row.total,
  });
  const operationalRhythm = computeOperationalRhythm(ctx, corridor, cst);
  const refreshDueScore = computeRefreshDueScore({
    cst,
    refreshCadenceScore: refreshCadence.score,
    cardsNeedingRefresh,
    corridorSkuTotal: row.total,
  });

  const overlapping = hasOverlappingLaunches(corridorWaves);
  const timingState = deriveTimingState({
    overlapPressure,
    burnoutRisk,
    refreshDueScore,
    spacingQuality,
    launchCadence: launchCadence.level,
    operationalRhythm,
    overlapping,
    scalingBlocked: ctx.scalingReport.safetyLevel === "blocked",
  });

  const recommendedCadence = deriveRecommendedCadence(
    launchCadence.level,
    refreshCadence.level,
    operationalRhythm,
  );

  const seasonalManual = deriveSeasonalContext({
    reviews: corridorReviews.length ? corridorReviews : ctx.launchReviews,
    launchPlanNotes: [
      ctx.launchPlan?.launchTiming.windowNote ?? "",
      ctx.launchPlan?.launchTiming.patienceNote ?? "",
      ...(ctx.launchPlan?.recommendations ?? []),
    ].join(" "),
  });

  const vars: Record<string, string> = {
    corridor,
    marketplace: ctx.marketplace,
    total: String(row.total),
    state: timingState,
    launchCadence: launchCadence.level,
    refreshCadence: refreshCadence.level,
  };

  const dangerousPatternKeys: string[] = [];
  const recommendedPatternKeys: string[] = [];

  if (launchCadence.level === "overloaded" || launchCadence.level === "chaotic") {
    dangerousPatternKeys.push("mtm.pattern.launchOverload");
  }
  if (isBurnoutRisk(burnoutRisk, refreshActions.length)) {
    dangerousPatternKeys.push("mtm.pattern.heroBurnout");
  }
  if (overlapping) dangerousPatternKeys.push("mtm.pattern.overlapWaves");
  if (operationalRhythm === "chaotic" || operationalRhythm === "overloaded") {
    dangerousPatternKeys.push("mtm.pattern.opsChaotic");
  }
  if (ctx.scalingReport.safetyLevel === "blocked" || ctx.scalingReport.safetyLevel === "unsafe") {
    dangerousPatternKeys.push("mtm.pattern.scalingUnsafe");
  }

  if (timingState === "well_spaced") {
    recommendedPatternKeys.push("mtm.pattern.maintainSpacing", "mtm.pattern.heroFirst");
  } else if (timingState === "refresh_due") {
    recommendedPatternKeys.push("mtm.pattern.refreshBeforeExpand", "mtm.pattern.visualPass");
  } else if (timingState === "burnout_risk") {
    recommendedPatternKeys.push("mtm.pattern.pauseHeroRefresh", "mtm.pattern.staggerCadence");
  } else if (timingState === "overlapping" || timingState === "crowded") {
    recommendedPatternKeys.push("mtm.pattern.staggerLaunches", "mtm.pattern.holdExpansion");
  } else {
    recommendedPatternKeys.push("mtm.pattern.reviewRhythm");
  }

  let reasonKey = "mtm.reason.default";
  if (timingState === "burnout_risk") reasonKey = "mtm.reason.burnout";
  else if (timingState === "overlapping") reasonKey = "mtm.reason.overlap";
  else if (timingState === "crowded") reasonKey = "mtm.reason.crowded";
  else if (timingState === "refresh_due") reasonKey = "mtm.reason.refreshDue";
  else if (timingState === "well_spaced") reasonKey = "mtm.reason.wellSpaced";
  else if (timingState === "unstable") reasonKey = "mtm.reason.unstable";

  return {
    id: existingId ?? newMarketTimingReportId(corridor),
    createdAt: Date.now(),
    corridor,
    marketplace: ctx.marketplace,
    timingState,
    launchCadence: launchCadence.level,
    refreshCadence: refreshCadence.level,
    burnoutRisk,
    overlapPressure,
    operationalRhythm,
    spacingQuality,
    seasonalContext: seasonalManual,
    refreshTiming: refreshTimingLabelKey(refreshDueScore),
    launchTiming: launchTimingLabelKey(spacingQuality, overlapPressure),
    recommendedCadence,
    dangerousPatternKeys: [...new Set(dangerousPatternKeys)].slice(0, 6),
    recommendedPatternKeys: [...new Set(recommendedPatternKeys)].slice(0, 6),
    confidenceNoteKey: seasonalManual ? "mtm.confidence.manualNotes" : "mtm.confidence.manual",
    reasonKey,
    reasonVars: vars,
  };
}

export function buildAllMarketTimingReports(ctx: MarketTimingGlobalContext): MarketTimingReport[] {
  if (!ctx.intel) return [];
  return ctx.intel.corridorSummary
    .filter((r) => r.corridor && r.corridor !== "—" && r.total > 0)
    .slice(0, 16)
    .map((row) => buildMarketTimingReport(row, ctx));
}

export function pickPrimaryMarketTimingReport(reports: MarketTimingReport[]): MarketTimingReport | null {
  if (!reports.length) return null;
  const rank = (s: TimingState) => {
    if (s === "unstable") return 6;
    if (s === "burnout_risk") return 5;
    if (s === "overlapping") return 4;
    if (s === "crowded") return 3;
    if (s === "refresh_due") return 2;
    return 1;
  };
  const urgent = reports.find(
    (r) =>
      r.timingState === "burnout_risk" ||
      r.timingState === "overlapping" ||
      r.timingState === "unstable" ||
      r.launchCadence === "chaotic",
  );
  if (urgent) return urgent;
  return [...reports].sort(
    (a, b) =>
      rank(b.timingState) - rank(a.timingState) ||
      b.overlapPressure - a.overlapPressure ||
      b.burnoutRisk - a.burnoutRisk,
  )[0]!;
}
