import type { AssortmentAction, AssortmentActionType } from "../assortment-actions/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { ScalingSafetyReport } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

const EXPANSION_ACTIONS: AssortmentActionType[] = [
  "launch_wave",
  "create_collection",
  "split_marketplace_group",
  "promote_hero_candidate",
  "prepare_fbo",
];

const REFRESH_ACTIONS: AssortmentActionType[] = [
  "refresh_visual",
  "improve_seo",
  "fix_data",
  "assign_corridor",
];

function expansionAction(a: AssortmentAction): boolean {
  return EXPANSION_ACTIONS.includes(a.actionType);
}

function refreshAction(a: AssortmentAction): boolean {
  return REFRESH_ACTIONS.includes(a.actionType);
}

export function shouldScalingSafetyHoldAction(action: AssortmentAction, report: ScalingSafetyReport | null): boolean {
  if (!report) return false;
  const mode = report.scalingMode;
  if (mode === "stop_and_review") return expansionAction(action) || action.actionType === "prepare_fbo";
  if (mode === "hold_expansion" || mode === "cleanup_first") return expansionAction(action);
  if (mode === "refresh_only") return expansionAction(action) || action.actionType === "prepare_fbo";
  if (mode === "scale_carefully" && report.safetyLevel === "unsafe") return expansionAction(action);
  return false;
}

export function augmentAssortmentWithScalingSafety(
  action: AssortmentAction,
  report: ScalingSafetyReport | null,
): Partial<
  Pick<
    AssortmentAction,
    | "riskReasons"
    | "titleVars"
    | "scalingSafetyHold"
    | "scalingSafetyBadgeKey"
    | "scalingSafetyMode"
  >
> {
  if (!report || report.safetyLevel === "safe") return {};

  const riskReasons = [...action.riskReasons];
  const explainKey = "aa.explain.risk.scalingSafety";
  if (!riskReasons.includes(explainKey)) riskReasons.push(explainKey);

  const scalingSafetyHold = shouldScalingSafetyHoldAction(action, report);

  return {
    riskReasons: riskReasons.slice(0, 8),
    titleVars: {
      ...action.titleVars,
      ssfMode: report.scalingMode,
      ssfLevel: report.safetyLevel,
      ssfCorridor: report.corridor,
    },
    scalingSafetyHold,
    scalingSafetyBadgeKey: "aa.scaling.badge",
    scalingSafetyMode: report.scalingMode,
  };
}

export function applyScalingSafetyToLaunchPlan(
  plan: MarketplaceLaunchPlan,
  report: ScalingSafetyReport | null,
  t: TFn,
): MarketplaceLaunchPlan {
  if (!report || report.safetyLevel === "safe") return plan;

  const banner = t("ssf.launch.banner", {
    mode: t(`ssf.mode.${report.scalingMode}`),
    level: t(`ssf.level.${report.safetyLevel}`),
  });

  const operationalWarnings = [banner, ...plan.operationalWarnings];
  const recommendations = [...plan.recommendations];
  const stopConditions = [...plan.stopConditions];

  const mainLine = t(report.mainReasonKey, report.mainReasonVars);
  if (!recommendations.includes(mainLine)) recommendations.push(mainLine);

  let expansionWave = plan.expansionWave;
  let launchReadiness = plan.launchReadiness;
  let launchReadinessScore = plan.launchReadinessScore;

  if (
    report.scalingMode === "stop_and_review" ||
    report.scalingMode === "hold_expansion" ||
    report.scalingMode === "cleanup_first"
  ) {
    expansionWave = {
      ...expansionWave,
      status: "hold",
      reason: t("ssf.launch.holdExpansion", { mode: t(`ssf.mode.${report.scalingMode}`) }),
    };
    launchReadinessScore = Math.min(launchReadinessScore, report.scalingMode === "stop_and_review" ? 42 : 50);
    if (launchReadiness === "expansion_ready" || launchReadiness === "ready") {
      launchReadiness = "fragile";
    }
  }

  if (report.scalingMode === "refresh_only") {
    expansionWave = {
      ...expansionWave,
      status: "hold",
      reason: t("ssf.launch.refreshOnly"),
    };
  }

  if (report.safetyLevel === "blocked") {
    const stop = t("ssf.launch.stopBlocked", { label: report.targetLabel });
    if (!stopConditions.includes(stop)) stopConditions.push(stop);
  }

  return {
    ...plan,
    operationalWarnings: [...new Set(operationalWarnings)].slice(0, 10),
    recommendations: recommendations.slice(0, 14),
    stopConditions: [...new Set(stopConditions)].slice(0, 12),
    expansionWave,
    launchReadiness,
    launchReadinessScore,
  };
}

export function reportToDisplay(
  report: ScalingSafetyReport,
  t: TFn,
): {
  mainReason: string;
  supportingSignals: string[];
  blockedBy: string[];
  allowedActions: string[];
  forbiddenActions: string[];
  recommendedNextStep: string;
  confidenceNote: string;
} {
  return {
    mainReason: t(report.mainReasonKey, report.mainReasonVars),
    supportingSignals: report.supportingSignalKeys.map((k) => t(k, report.mainReasonVars)),
    blockedBy: report.blockedByKeys.map((k) => t(k, report.mainReasonVars)),
    allowedActions: report.allowedActionKeys.map((k) => t(k, report.mainReasonVars)),
    forbiddenActions: report.forbiddenActionKeys.map((k) => t(k, report.mainReasonVars)),
    recommendedNextStep: t(report.recommendedNextStepKey, report.recommendedNextStepVars),
    confidenceNote: t(report.confidenceNoteKey),
  };
}

export function formatScalingSafetyFounderLine(report: ScalingSafetyReport | null, t: TFn): string | null {
  if (!report || report.safetyLevel === "safe") return null;
  return t("ssf.founder.line", {
    mode: t(`ssf.mode.${report.scalingMode}`),
    reason: t(report.mainReasonKey, report.mainReasonVars),
  });
}

export function formatScalingSafetyDailyLine(report: ScalingSafetyReport | null, t: TFn): string | null {
  if (!report || report.safetyLevel === "safe") return null;
  return t("ssf.daily.line", {
    mode: t(`ssf.mode.${report.scalingMode}`),
    level: t(`ssf.level.${report.safetyLevel}`),
    label: report.targetLabel,
  });
}

export function getCollectionScalingSafetyHint(report: ScalingSafetyReport | null, t: TFn): string | null {
  if (!report || report.safetyLevel === "safe") return null;
  return t("ssf.collection.hint", {
    mode: t(`ssf.mode.${report.scalingMode}`),
    label: report.targetLabel,
    step: t(report.recommendedNextStepKey, report.recommendedNextStepVars),
  });
}

export function getMarketplaceOpsScalingHint(report: ScalingSafetyReport | null, t: TFn): string | null {
  if (!report || report.safetyLevel === "safe" || report.safetyLevel === "cautious") return null;
  return t("ssf.marketplace.hint", {
    mode: t(`ssf.mode.${report.scalingMode}`),
    corridor: report.corridor,
  });
}

export function prefersRefreshActions(report: ScalingSafetyReport | null): boolean {
  return report?.scalingMode === "refresh_only";
}

export { refreshAction, expansionAction };
