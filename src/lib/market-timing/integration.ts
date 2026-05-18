import type { AssortmentAction, AssortmentActionType } from "../assortment-actions/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { MarketTimingReport } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

const EXPANSION_TYPES: AssortmentActionType[] = [
  "launch_wave",
  "create_collection",
  "promote_hero_candidate",
  "prepare_fbo",
  "split_marketplace_group",
];

const REFRESH_TYPES: AssortmentActionType[] = [
  "refresh_visual",
  "improve_seo",
  "archive_weak_sku",
  "hero_workflow_step",
];

function expansionAction(a: AssortmentAction): boolean {
  return EXPANSION_TYPES.includes(a.actionType);
}

function refreshAction(a: AssortmentAction): boolean {
  return REFRESH_TYPES.includes(a.actionType) || /refresh/i.test(a.titleKey);
}

function corridorMatch(action: AssortmentAction, report: MarketTimingReport): boolean {
  const c = (action.corridor ?? "").trim();
  return !c || c === report.corridor;
}

export function shouldMarketTimingHoldAction(
  action: AssortmentAction,
  report: MarketTimingReport | null,
): boolean {
  if (!report || !corridorMatch(action, report)) return false;
  if (!expansionAction(action)) return false;
  if (
    report.launchCadence === "overloaded" ||
    report.launchCadence === "chaotic" ||
    report.timingState === "overlapping" ||
    report.timingState === "burnout_risk" ||
    report.timingState === "unstable"
  ) {
    return true;
  }
  if (report.timingState === "crowded" && report.overlapPressure >= 48) return true;
  return false;
}

export function augmentAssortmentWithMarketTiming(
  action: AssortmentAction,
  reports: MarketTimingReport[],
): Partial<
  Pick<
    AssortmentAction,
    "riskReasons" | "titleVars" | "marketTimingHold" | "marketTimingBadgeKey" | "marketTimingState"
  >
> {
  const report =
    reports.find((r) => corridorMatch(action, r)) ??
    reports.find((r) => action.corridor && r.corridor === action.corridor) ??
    null;
  if (!report) return {};

  const riskReasons = [...action.riskReasons];
  const key = "aa.explain.risk.marketTiming";
  if (!riskReasons.includes(key)) riskReasons.push(key);

  const hold = shouldMarketTimingHoldAction(action, report);
  if (report.timingState === "refresh_due" && refreshAction(action)) {
    return {
      riskReasons: riskReasons.slice(0, 8),
      titleVars: {
        ...action.titleVars,
        mtmCorridor: report.corridor,
        mtmState: report.timingState,
        mtmLaunchCadence: report.launchCadence,
      },
      marketTimingHold: false,
      marketTimingBadgeKey: "aa.timing.badge",
      marketTimingState: report.timingState,
    };
  }

  return {
    riskReasons: riskReasons.slice(0, 8),
    titleVars: {
      ...action.titleVars,
      mtmCorridor: report.corridor,
      mtmState: report.timingState,
      mtmLaunchCadence: report.launchCadence,
    },
    marketTimingHold: hold,
    marketTimingBadgeKey: "aa.timing.badge",
    marketTimingState: report.timingState,
  };
}

export function applyMarketTimingToLaunchPlan(
  plan: MarketplaceLaunchPlan,
  report: MarketTimingReport | null,
  t: TFn,
): MarketplaceLaunchPlan {
  if (!report) return plan;

  const banner = t("mtm.launch.banner", {
    corridor: report.corridor,
    state: t(`mtm.state.${report.timingState}`),
    cadence: t(`mtm.cadence.${report.launchCadence}`),
  });

  const operationalWarnings = [banner, ...plan.operationalWarnings];
  const recommendations = [...plan.recommendations];
  const reason = t(report.reasonKey, report.reasonVars);
  if (!recommendations.includes(reason)) recommendations.push(reason);

  let expansionWave = plan.expansionWave;
  let heroWave = plan.heroWave;
  if (
    report.timingState === "overlapping" ||
    report.timingState === "burnout_risk" ||
    report.launchCadence === "chaotic" ||
    report.launchCadence === "overloaded"
  ) {
    expansionWave = {
      ...expansionWave,
      status: "hold",
      reason: t("mtm.launch.holdExpansion", { corridor: report.corridor }),
    };
  }
  if (report.timingState === "burnout_risk") {
    heroWave = {
      ...heroWave,
      reason: t("mtm.launch.heroPatience", { corridor: report.corridor }),
    };
  }
  if (report.timingState === "refresh_due") {
    recommendations.push(t("mtm.launch.refreshFirst", { corridor: report.corridor }));
  }

  return {
    ...plan,
    operationalWarnings: [...new Set(operationalWarnings)].slice(0, 12),
    recommendations: [...new Set(recommendations)].slice(0, 15),
    expansionWave,
    heroWave,
    launchTiming: {
      label: t(`mtm.state.${report.timingState}`),
      windowNote: t(report.launchTiming, report.reasonVars),
      patienceNote: t(report.refreshTiming, report.reasonVars),
    },
  };
}

export function reportToDisplay(report: MarketTimingReport, t: TFn) {
  return {
    reason: t(report.reasonKey, report.reasonVars),
    dangerousPatterns: report.dangerousPatternKeys.map((k) => t(k, report.reasonVars)),
    recommendedPatterns: report.recommendedPatternKeys.map((k) => t(k, report.reasonVars)),
    confidenceNote: t(report.confidenceNoteKey),
    seasonalContext: report.seasonalContext || t("mtm.seasonal.none"),
    refreshTiming: t(report.refreshTiming, report.reasonVars),
    launchTiming: t(report.launchTiming, report.reasonVars),
  };
}

export function formatMarketTimingFounderLine(report: MarketTimingReport | null, t: TFn): string | null {
  if (!report) return null;
  if (report.launchCadence === "overloaded" || report.launchCadence === "chaotic") {
    return t("mtm.founder.launchOverload", { corridor: report.corridor });
  }
  if (report.timingState === "burnout_risk") {
    return t("mtm.founder.heroUnstable", { corridor: report.corridor });
  }
  if (report.timingState === "refresh_due") {
    return t("mtm.founder.refreshDue", { corridor: report.corridor });
  }
  if (report.timingState === "well_spaced") {
    return t("mtm.founder.spacingHealthy", { corridor: report.corridor });
  }
  return t("mtm.founder.line", {
    corridor: report.corridor,
    state: t(`mtm.state.${report.timingState}`),
  });
}

export function formatMarketTimingDailyLine(report: MarketTimingReport | null, t: TFn): string | null {
  if (!report) return null;
  return t("mtm.daily.line", {
    corridor: report.corridor,
    state: t(`mtm.state.${report.timingState}`),
    cadence: t(`mtm.cadence.${report.launchCadence}`),
  });
}

export function getCollectionMarketTimingHint(report: MarketTimingReport | null, t: TFn): string | null {
  if (!report || report.timingState === "well_spaced") return null;
  return t("mtm.collection.hint", {
    corridor: report.corridor,
    state: t(`mtm.state.${report.timingState}`),
  });
}

export function getMarketplaceOpsTimingHint(report: MarketTimingReport | null, t: TFn): string | null {
  if (!report) return null;
  if (report.timingState === "well_spaced" && report.launchCadence === "stable") return null;
  return t("mtm.marketplace.hint", {
    corridor: report.corridor,
    cadence: t(`mtm.cadence.${report.launchCadence}`),
  });
}
