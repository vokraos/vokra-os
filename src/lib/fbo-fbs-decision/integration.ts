import type { AssortmentAction } from "../assortment-actions/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { FboFbsDecisionReport, FboRecommendedMode } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

const STOP_FBO_MODES: FboRecommendedMode[] = ["stop_fbo_expansion", "cleanup_before_fbo", "keep_fbs"];

export function shouldFboFbsHoldAction(action: AssortmentAction, report: FboFbsDecisionReport | null): boolean {
  if (!report) return false;
  if (action.actionType !== "prepare_fbo") return false;
  if (report.recommendedMode === "stop_fbo_expansion") return true;
  if (report.recommendedMode === "cleanup_before_fbo") return true;
  if (report.recommendedMode === "keep_fbs" && report.readiness === "blocked") return true;
  if (STOP_FBO_MODES.includes(report.recommendedMode) && report.readiness === "fragile") {
    return report.recommendedMode !== "keep_fbs" || fitBlocksFbo(report);
  }
  return false;
}

function fitBlocksFbo(report: FboFbsDecisionReport): boolean {
  return report.economicsFit === "blocked" || report.economicsFit === "fragile";
}

export function augmentAssortmentWithFboFbsDecision(
  action: AssortmentAction,
  report: FboFbsDecisionReport | null,
): Partial<
  Pick<AssortmentAction, "riskReasons" | "titleVars" | "fboFbsDecisionHold" | "fboFbsBadgeKey" | "fboFbsMode">
> {
  if (!report) return {};

  const riskReasons = [...action.riskReasons];
  const explainKey = "aa.explain.risk.fboFbsDecision";
  if (!riskReasons.includes(explainKey)) riskReasons.push(explainKey);

  const fboFbsDecisionHold = shouldFboFbsHoldAction(action, report);

  return {
    riskReasons: riskReasons.slice(0, 8),
    titleVars: {
      ...action.titleVars,
      ffdMode: report.recommendedMode,
      ffdReadiness: report.readiness,
      ffdCorridor: report.corridor,
    },
    fboFbsDecisionHold,
    fboFbsBadgeKey: "aa.fbo.badge",
    fboFbsMode: report.recommendedMode,
  };
}

export function applyFboFbsDecisionToLaunchPlan(
  plan: MarketplaceLaunchPlan,
  report: FboFbsDecisionReport | null,
  t: TFn,
): MarketplaceLaunchPlan {
  if (!report) return plan;

  const banner = t("ffd.launch.banner", {
    mode: t(`ffd.mode.${report.recommendedMode}`),
    readiness: t(`ffd.readiness.${report.readiness}`),
  });

  const operationalWarnings = [banner, ...plan.operationalWarnings];
  const recommendations = [...plan.recommendations];
  const reasonLine = t(report.reasonKey, report.reasonVars);
  if (!recommendations.includes(reasonLine)) recommendations.push(reasonLine);

  const testLine = t(report.testWaveSuggestionKey, report.testWaveSuggestionVars);
  if (testLine && !recommendations.includes(testLine)) recommendations.push(testLine);

  let expansionWave = plan.expansionWave;
  let fboPressure = plan.fboPressure;

  if (report.recommendedMode === "stop_fbo_expansion" || report.recommendedMode === "cleanup_before_fbo") {
    expansionWave = {
      ...expansionWave,
      status: "hold",
      reason: t("ffd.launch.holdFbo", { mode: t(`ffd.mode.${report.recommendedMode}`) }),
    };
    fboPressure = Math.min(100, fboPressure + 18);
  } else if (report.recommendedMode === "test_fbo_small" || report.recommendedMode === "mixed_mode") {
    recommendations.push(t("ffd.launch.testWaveRec", { suggestion: testLine }));
  } else if (report.recommendedMode === "keep_fbs") {
    fboPressure = Math.max(0, fboPressure - 8);
  }

  return {
    ...plan,
    operationalWarnings: [...new Set(operationalWarnings)].slice(0, 11),
    recommendations: recommendations.slice(0, 15),
    expansionWave,
    fboPressure,
  };
}

export function reportToDisplay(report: FboFbsDecisionReport, t: TFn) {
  return {
    reason: t(report.reasonKey, report.reasonVars),
    risks: report.riskKeys.map((k) => t(k, report.reasonVars)),
    allowedActions: report.allowedActionKeys.map((k) => t(k, report.reasonVars)),
    forbiddenActions: report.forbiddenActionKeys.map((k) => t(k, report.reasonVars)),
    recommendedNextStep: t(report.recommendedNextStepKey, report.recommendedNextStepVars),
    testWaveSuggestion: t(report.testWaveSuggestionKey, report.testWaveSuggestionVars),
    confidenceNote: t(report.confidenceNoteKey),
  };
}

export function formatFboFbsFounderLine(report: FboFbsDecisionReport | null, t: TFn): string | null {
  if (!report || report.recommendedMode === "keep_fbs" && report.readiness === "ready") return null;
  if (report.recommendedMode === "move_to_fbo" && report.readiness === "expansion_ready") return null;
  return t("ffd.founder.line", {
    mode: t(`ffd.mode.${report.recommendedMode}`),
    label: report.targetLabel,
  });
}

export function formatFboFbsDailyLine(report: FboFbsDecisionReport | null, t: TFn): string | null {
  if (!report) return null;
  if (report.recommendedMode === "keep_fbs" && report.readiness !== "blocked" && report.readiness !== "fragile") {
    return null;
  }
  return t("ffd.daily.line", {
    mode: t(`ffd.mode.${report.recommendedMode}`),
    label: report.targetLabel,
  });
}

export function getCollectionFboFbsHint(report: FboFbsDecisionReport | null, t: TFn): string | null {
  if (!report) return null;
  return t("ffd.collection.hint", {
    mode: t(`ffd.mode.${report.recommendedMode}`),
    label: report.targetLabel,
    step: t(report.recommendedNextStepKey, report.recommendedNextStepVars),
  });
}

export function getMarketplaceOpsFboHint(report: FboFbsDecisionReport | null, t: TFn): string | null {
  if (!report || report.recommendedMode === "keep_fbs") return null;
  return t("ffd.marketplace.hint", {
    mode: t(`ffd.mode.${report.recommendedMode}`),
    corridor: report.corridor,
  });
}
