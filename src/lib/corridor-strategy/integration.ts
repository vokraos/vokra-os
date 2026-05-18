import type { AssortmentAction, AssortmentActionType } from "../assortment-actions/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { CorridorStrategyReport } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

const EXPANSION_TYPES: AssortmentActionType[] = [
  "launch_wave",
  "create_collection",
  "promote_hero_candidate",
  "prepare_fbo",
  "split_marketplace_group",
];

function expansionAction(a: AssortmentAction): boolean {
  return EXPANSION_TYPES.includes(a.actionType);
}

function corridorMatch(action: AssortmentAction, report: CorridorStrategyReport): boolean {
  const c = (action.corridor ?? "").trim();
  return !c || c === report.corridor;
}

export function shouldCorridorStrategyHoldAction(
  action: AssortmentAction,
  report: CorridorStrategyReport | null,
): boolean {
  if (!report || !corridorMatch(action, report)) return false;
  if (report.corridorState === "unstable" && expansionAction(action)) return true;
  if (
    (report.recommendedStrategy === "reduce" ||
      report.recommendedStrategy === "archive" ||
      report.recommendedStrategy === "consolidate") &&
    expansionAction(action)
  ) {
    return true;
  }
  if (report.recommendedStrategy === "refresh" && action.actionType === "prepare_fbo") return true;
  return false;
}

export function augmentAssortmentWithCorridorStrategy(
  action: AssortmentAction,
  reports: CorridorStrategyReport[],
): Partial<
  Pick<AssortmentAction, "riskReasons" | "titleVars" | "corridorStrategyHold" | "corridorStrategyBadgeKey" | "corridorStrategyKey">
> {
  const report =
    reports.find((r) => corridorMatch(action, r)) ??
    reports.find((r) => action.corridor && r.corridor === action.corridor) ??
    null;
  if (!report) return {};

  const riskReasons = [...action.riskReasons];
  const key = "aa.explain.risk.corridorStrategy";
  if (!riskReasons.includes(key)) riskReasons.push(key);

  return {
    riskReasons: riskReasons.slice(0, 8),
    titleVars: {
      ...action.titleVars,
      cstCorridor: report.corridor,
      cstState: report.corridorState,
      cstStrategy: report.recommendedStrategy,
    },
    corridorStrategyHold: shouldCorridorStrategyHoldAction(action, report),
    corridorStrategyBadgeKey: "aa.corridor.badge",
    corridorStrategyKey: report.recommendedStrategy,
  };
}

export function applyCorridorStrategyToLaunchPlan(
  plan: MarketplaceLaunchPlan,
  report: CorridorStrategyReport | null,
  t: TFn,
): MarketplaceLaunchPlan {
  if (!report) return plan;

  const banner = t("cst.launch.banner", {
    corridor: report.corridor,
    strategy: t(`cst.strategy.${report.recommendedStrategy}`),
    state: t(`cst.state.${report.corridorState}`),
  });

  const operationalWarnings = [banner, ...plan.operationalWarnings];
  const recommendations = [...plan.recommendations];
  const reason = t(report.strategyReasonKey, report.strategyReasonVars);
  if (!recommendations.includes(reason)) recommendations.push(reason);

  let expansionWave = plan.expansionWave;
  if (
    report.recommendedStrategy === "reduce" ||
    report.recommendedStrategy === "archive" ||
    report.corridorState === "unstable"
  ) {
    expansionWave = {
      ...expansionWave,
      status: "hold",
      reason: t("cst.launch.holdExpansion", { corridor: report.corridor }),
    };
  }
  return {
    ...plan,
    operationalWarnings: [...new Set(operationalWarnings)].slice(0, 11),
    recommendations: recommendations.slice(0, 14),
    expansionWave,
  };
}

export function reportToDisplay(report: CorridorStrategyReport, t: TFn) {
  return {
    strategyReason: t(report.strategyReasonKey, report.strategyReasonVars),
    forbiddenMoves: report.forbiddenMoveKeys.map((k) => t(k, report.strategyReasonVars)),
    recommendedMoves: report.recommendedMoveKeys.map((k) => t(k, report.strategyReasonVars)),
    confidenceNote: t(report.confidenceNoteKey),
  };
}

export function formatCorridorStrategyFounderLine(report: CorridorStrategyReport | null, t: TFn): string | null {
  if (!report) return null;
  if (report.corridorState === "scalable" && report.recommendedStrategy === "dominate") {
    return t("cst.founder.scalable", { corridor: report.corridor });
  }
  if (report.corridorState === "fragmented" || report.recommendedStrategy === "consolidate") {
    return t("cst.founder.fragmented", { corridor: report.corridor });
  }
  if (report.corridorState === "refresh_needed" || report.recommendedStrategy === "refresh") {
    return t("cst.founder.refresh", { corridor: report.corridor });
  }
  if (report.recommendedStrategy === "scale_carefully" && report.corridorState === "scalable") {
    return t("cst.founder.scalable", { corridor: report.corridor });
  }
  return t("cst.founder.line", {
    corridor: report.corridor,
    strategy: t(`cst.strategy.${report.recommendedStrategy}`),
  });
}

export function formatCorridorStrategyDailyLine(report: CorridorStrategyReport | null, t: TFn): string | null {
  if (!report) return null;
  return t("cst.daily.line", {
    corridor: report.corridor,
    strategy: t(`cst.strategy.${report.recommendedStrategy}`),
    state: t(`cst.state.${report.corridorState}`),
  });
}

export function getCollectionCorridorStrategyHint(report: CorridorStrategyReport | null, t: TFn): string | null {
  if (!report) return null;
  return t("cst.collection.hint", {
    corridor: report.corridor,
    strategy: t(`cst.strategy.${report.recommendedStrategy}`),
  });
}

export function getMarketplaceOpsCorridorHint(report: CorridorStrategyReport | null, t: TFn): string | null {
  if (!report) return null;
  if (report.corridorState === "emerging" && report.recommendedStrategy === "scale_carefully") return null;
  return t("cst.marketplace.hint", {
    corridor: report.corridor,
    strategy: t(`cst.strategy.${report.recommendedStrategy}`),
    state: t(`cst.state.${report.corridorState}`),
  });
}
