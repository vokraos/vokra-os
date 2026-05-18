import { hasGuardrailType } from "../economic-guardrails/match";
import type { FboFbsDecisionGatherContext, FboFbsDecisionReport, FboRecommendedMode } from "./types";
import { confidenceFromReadiness, fitRank, newFboFbsDecisionReportId, readinessFromScore } from "./levels";
import { inferCurrentStockMode } from "./gather";
import {
  computeEconomicsFit,
  computeLaunchFit,
  computeOperationalFit,
  computeSeoFit,
  computeVisualContentFit,
} from "./fit";

export function deriveFboFbsDecision(
  ctx: FboFbsDecisionGatherContext,
  existingId?: string,
): FboFbsDecisionReport {
  const economicsFit = computeEconomicsFit(ctx);
  const launchFit = computeLaunchFit(ctx);
  const seoFit = computeSeoFit(ctx);
  const visualContentFit = computeVisualContentFit(ctx);
  const operationalFit = computeOperationalFit(ctx);

  const avgFit =
    (fitRank(economicsFit) +
      fitRank(launchFit) +
      fitRank(seoFit) +
      fitRank(visualContentFit) +
      fitRank(operationalFit)) /
    5;

  const readinessScore = Math.round(avgFit * 22 + (ctx.launchPlan?.launchReadinessScore ?? 40) * 0.35);
  const readiness = readinessFromScore(readinessScore);
  const decisionConfidence = confidenceFromReadiness(readiness, Boolean(ctx.econCtx.snapshot));

  const currentStockMode = inferCurrentStockMode(ctx);
  const vars: Record<string, string> = {
    corridor: ctx.corridor,
    label: ctx.targetLabel,
    marketplace: ctx.marketplace,
    current: currentStockMode,
  };

  const riskKeys: string[] = [];
  if (fitRank(economicsFit) <= 1) riskKeys.push("ffd.risk.economics");
  if (fitRank(seoFit) <= 1) riskKeys.push("ffd.risk.seo");
  if (fitRank(visualContentFit) <= 1) riskKeys.push("ffd.risk.visual");
  if (ctx.scalingReport.scalingMode === "stop_and_review") riskKeys.push("ffd.risk.scalingBlocked");
  if (hasGuardrailType(ctx.guardrails, ["avoid_fbo_scaling"], "caution")) riskKeys.push("ffd.risk.guardrailFbo");
  if (ctx.econCtx.intel?.fboExposureSummary.mixedCorridors.length) {
    riskKeys.push("ffd.risk.mixedCorridor");
    vars.mixed = String(ctx.econCtx.intel.fboExposureSummary.mixedCorridors.length);
  }

  let recommendedMode: FboRecommendedMode = "keep_fbs";
  let reasonKey = "ffd.reason.keepFbsDefault";
  let testWaveSuggestionKey = "ffd.test.none";

  const scalingBlocked =
    ctx.scalingReport.safetyLevel === "blocked" ||
    ctx.scalingReport.scalingMode === "stop_and_review" ||
    ctx.scalingReport.scalingMode === "hold_expansion";

  const economicsDangerous = fitRank(economicsFit) <= 1;
  const cleanupNeeded = fitRank(seoFit) <= 1 || fitRank(visualContentFit) <= 1 || !ctx.econCtx.snapshot;
  const guardrailStop = hasGuardrailType(
    ctx.guardrails,
    ["avoid_fbo_scaling", "hold_expansion", "require_cost_review"],
    "elevated",
  );

  if (scalingBlocked || (economicsDangerous && guardrailStop)) {
    recommendedMode = "stop_fbo_expansion";
    reasonKey = "ffd.reason.stopScalingEconomics";
    testWaveSuggestionKey = "ffd.test.hold";
  } else if (economicsDangerous || guardrailStop) {
    recommendedMode = "keep_fbs";
    reasonKey = "ffd.reason.keepFbsEconomics";
    testWaveSuggestionKey = "ffd.test.hold";
  } else if (cleanupNeeded) {
    recommendedMode = "cleanup_before_fbo";
    reasonKey = "ffd.reason.cleanupBeforeFbo";
    vars.seo = String(ctx.econCtx.intel?.seoGapSummary.cardsMissingSeo ?? 0);
    testWaveSuggestionKey = "ffd.test.afterCleanup";
  } else if (
    ctx.econCtx.intel &&
    ctx.econCtx.intel.fboExposureSummary.mixedCorridors.length >= 1 &&
    fitRank(operationalFit) >= 2
  ) {
    recommendedMode = "mixed_mode";
    reasonKey = "ffd.reason.mixedCorridor";
    testWaveSuggestionKey = "ffd.test.mixedSmall";
  } else if (
    readiness === "expansion_ready" ||
    (readiness === "ready" && fitRank(economicsFit) >= 3 && fitRank(launchFit) >= 3)
  ) {
    recommendedMode = "move_to_fbo";
    reasonKey = "ffd.reason.moveToFbo";
    testWaveSuggestionKey = "ffd.test.controlledWave";
  } else if (readiness === "test_ready" || readiness === "ready") {
    recommendedMode = "test_fbo_small";
    reasonKey = "ffd.reason.testSmall";
    testWaveSuggestionKey = "ffd.test.heroSupportSmall";
  } else if (readiness === "fragile") {
    recommendedMode = "keep_fbs";
    reasonKey = "ffd.reason.keepFbsFragile";
    testWaveSuggestionKey = "ffd.test.later";
  } else {
    recommendedMode = "keep_fbs";
    reasonKey = "ffd.reason.keepFbsBlocked";
    testWaveSuggestionKey = "ffd.test.hold";
  }

  if (ctx.adReport.adDependencyLevel === "dangerous" || ctx.adReport.adDependencyLevel === "critical") {
    if (recommendedMode === "move_to_fbo") {
      recommendedMode = "test_fbo_small";
      reasonKey = "ffd.reason.testSmallAdsElevated";
    }
  }

  const allowedActionKeys: string[] = [];
  const forbiddenActionKeys: string[] = [];

  if (recommendedMode === "move_to_fbo" || recommendedMode === "test_fbo_small") {
    allowedActionKeys.push("ffd.allow.testWave", "ffd.allow.fboPrep");
  } else if (recommendedMode === "mixed_mode") {
    allowedActionKeys.push("ffd.allow.mixedBatch", "ffd.allow.fbsAnchor");
    forbiddenActionKeys.push("ffd.forbid.fullFbo");
  } else if (recommendedMode === "cleanup_before_fbo") {
    allowedActionKeys.push("ffd.allow.seoVisual", "ffd.allow.dataFix");
    forbiddenActionKeys.push("ffd.forbid.fboShip", "ffd.forbid.fboScale");
  } else if (recommendedMode === "stop_fbo_expansion") {
    allowedActionKeys.push("ffd.allow.reviewEconomics");
    forbiddenActionKeys.push("ffd.forbid.fboExpansion", "ffd.forbid.prepareFbo");
  } else {
    allowedActionKeys.push("ffd.allow.fbsOps", "ffd.allow.refresh");
    forbiddenActionKeys.push("ffd.forbid.fboScale");
  }

  let recommendedNextStepKey = "ffd.next.review";
  if (recommendedMode === "test_fbo_small") recommendedNextStepKey = "ffd.next.testWave";
  else if (recommendedMode === "move_to_fbo") recommendedNextStepKey = "ffd.next.planFbo";
  else if (recommendedMode === "mixed_mode") recommendedNextStepKey = "ffd.next.mixedPlan";
  else if (recommendedMode === "cleanup_before_fbo") recommendedNextStepKey = "ffd.next.cleanup";
  else if (recommendedMode === "stop_fbo_expansion") recommendedNextStepKey = "ffd.next.stopFbo";

  return {
    id: existingId ?? newFboFbsDecisionReportId(),
    createdAt: Date.now(),
    targetLabel: ctx.targetLabel,
    corridor: ctx.corridor,
    marketplace: ctx.marketplace,
    currentStockMode,
    recommendedMode,
    decisionConfidence,
    reasonKey,
    reasonVars: vars,
    readiness,
    economicsFit,
    launchFit,
    visualContentFit,
    seoFit,
    operationalFit,
    riskKeys: [...new Set(riskKeys)].slice(0, 8),
    allowedActionKeys: [...new Set(allowedActionKeys)].slice(0, 6),
    forbiddenActionKeys: [...new Set(forbiddenActionKeys)].slice(0, 6),
    recommendedNextStepKey,
    recommendedNextStepVars: vars,
    testWaveSuggestionKey,
    testWaveSuggestionVars: vars,
    confidenceNoteKey: "ffd.confidence.manual",
  };
}
