import { hasGuardrailType } from "../economic-guardrails/match";
import type { ScalingMode, ScalingSafetyGatherContext, ScalingSafetyLevel, ScalingSafetyReport } from "./types";
import { newScalingSafetyReportId } from "./levels";
import { snapshotCleanupPressure } from "./gather";

function rankEcon(level: string): number {
  if (level === "critical") return 5;
  if (level === "dangerous") return 4;
  if (level === "elevated") return 3;
  if (level === "manageable") return 2;
  return 1;
}

function rankPrice(level: string): number {
  if (level === "negative") return 5;
  if (level === "dangerous") return 4;
  if (level === "tight") return 3;
  if (level === "watch") return 2;
  return 1;
}

function rankAd(level: string): number {
  return rankEcon(level);
}

function rankLaunchReadiness(level: string): number {
  if (level === "blocked") return 5;
  if (level === "fragile") return 4;
  if (level === "operational") return 2;
  if (level === "ready") return 1;
  if (level === "expansion_ready") return 0;
  return 3;
}

export function deriveScalingSafety(
  ctx: ScalingSafetyGatherContext,
  existingId?: string,
): ScalingSafetyReport {
  const vars: Record<string, string> = {
    corridor: ctx.corridor,
    label: ctx.targetLabel,
    marketplace: ctx.marketplace,
    stockMode: ctx.stockMode,
  };

  const supportingSignalKeys: string[] = [];
  const blockedByKeys: string[] = [];

  const econWorst = [
    ctx.econReport.expansionLevel,
    ctx.econReport.warehouseLevel,
    ctx.econReport.launchLevel,
    ctx.econReport.refreshLevel,
  ].sort((a, b) => rankEcon(b) - rankEcon(a))[0]!;

  const priceLevel = ctx.priceReport?.pricePressureLevel ?? "watch";
  const adLevel = ctx.adReport.adDependencyLevel;
  const launchReady = ctx.launchPlan?.launchReadiness ?? "operational";
  const launchScore = ctx.launchPlan?.launchReadinessScore ?? 50;
  const cleanupScore = snapshotCleanupPressure(ctx);
  const heroIdx = ctx.heroFatigue?.fatiguePressureIndex ?? 0;
  const fboPressure = ctx.launchPlan?.fboPressure ?? 0;
  const fbsPressure = ctx.launchPlan?.fbsPressure ?? 0;

  if (rankEcon(econWorst) >= 3) supportingSignalKeys.push("ssf.signal.economicPressure");
  if (rankPrice(priceLevel) >= 3) supportingSignalKeys.push("ssf.signal.pricePressure");
  if (rankAd(adLevel) >= 3) supportingSignalKeys.push("ssf.signal.adPressure");
  if (ctx.launchPlan) supportingSignalKeys.push("ssf.signal.launchOps");
  if (heroIdx >= 45) supportingSignalKeys.push("ssf.signal.heroFatigue");
  if (cleanupScore >= 55) supportingSignalKeys.push("ssf.signal.assortmentCleanup");
  if (fboPressure >= 55 || fbsPressure >= 50) supportingSignalKeys.push("ssf.signal.fboFbsBurden");

  const dangerousGuardrail = ctx.guardrails.some(
    (g) => g.severity === "critical" || g.severity === "elevated",
  );
  const holdExpansionGr = hasGuardrailType(
    ctx.guardrails,
    ["hold_expansion", "limit_launch_wave", "allow_only_refresh"],
    "caution",
  );

  if (dangerousGuardrail) blockedByKeys.push("ssf.blocked.guardrail");
  if (rankPrice(priceLevel) >= 4) blockedByKeys.push("ssf.blocked.price");
  if (rankAd(adLevel) >= 4) blockedByKeys.push("ssf.blocked.ads");
  if (rankEcon(econWorst) >= 4) blockedByKeys.push("ssf.blocked.economics");
  if (!ctx.econCtx.snapshot) blockedByKeys.push("ssf.blocked.noSnapshot");
  if (cleanupScore >= 70) blockedByKeys.push("ssf.blocked.cleanup");

  let safetyLevel: ScalingSafetyLevel = "cautious";
  let scalingMode: ScalingMode = "scale_carefully";
  let mainReasonKey = "ssf.reason.moderatePressure";

  const economicsAdsUnsafe =
    (rankPrice(priceLevel) >= 4 || priceLevel === "negative") &&
    (rankAd(adLevel) >= 4 || ctx.adReport.unsafeAdSpendRisk === "critical" || ctx.adReport.unsafeAdSpendRisk === "dangerous");

  if (economicsAdsUnsafe || (dangerousGuardrail && rankPrice(priceLevel) >= 3)) {
    safetyLevel = "blocked";
    scalingMode = "stop_and_review";
    mainReasonKey = "ssf.reason.stopEconomicsAds";
  } else if (
    holdExpansionGr ||
    rankEcon(econWorst) >= 4 ||
    rankPrice(priceLevel) >= 4 ||
    rankAd(adLevel) >= 4 ||
    launchReady === "blocked"
  ) {
    safetyLevel = "unsafe";
    scalingMode = "hold_expansion";
    mainReasonKey = holdExpansionGr ? "ssf.reason.holdGuardrail" : "ssf.reason.holdExpansion";
  } else if (cleanupScore >= 65 || !ctx.econCtx.snapshot) {
    safetyLevel = "fragile";
    scalingMode = "cleanup_first";
    mainReasonKey = !ctx.econCtx.snapshot ? "ssf.reason.cleanupNoSnap" : "ssf.reason.cleanupData";
    if (ctx.econCtx.intel) {
      vars.missing = String(ctx.econCtx.intel.missingFieldSummary.totalSlots);
      vars.seo = String(ctx.econCtx.intel.seoGapSummary.cardsMissingSeo);
    }
  } else if (heroIdx >= 52 && rankPrice(priceLevel) <= 2 && rankAd(adLevel) <= 2) {
    safetyLevel = "fragile";
    scalingMode = "refresh_only";
    mainReasonKey = "ssf.reason.refreshHeroFatigue";
    vars.heroIdx = String(Math.round(heroIdx));
  } else if (
    launchReady === "expansion_ready" ||
    (launchReady === "ready" && launchScore >= 62)
  ) {
    if (
      rankEcon(econWorst) <= 2 &&
      rankPrice(priceLevel) <= 1 &&
      rankAd(adLevel) <= 2 &&
      cleanupScore < 45 &&
      !dangerousGuardrail
    ) {
      safetyLevel = "safe";
      scalingMode = "scale";
      mainReasonKey = "ssf.reason.safeToScale";
    } else {
      safetyLevel = "cautious";
      scalingMode = "scale_carefully";
      mainReasonKey = "ssf.reason.scaleCarefullyHealthy";
    }
  } else if (rankLaunchReadiness(launchReady) >= 4 || launchScore < 48) {
    safetyLevel = "fragile";
    scalingMode = "scale_carefully";
    mainReasonKey = "ssf.reason.launchFragile";
  } else if (rankEcon(econWorst) >= 3 || rankAd(adLevel) >= 3) {
    safetyLevel = "fragile";
    scalingMode = "scale_carefully";
    mainReasonKey = "ssf.reason.moderatePressure";
  } else {
    safetyLevel = "cautious";
    scalingMode = "scale_carefully";
    mainReasonKey = "ssf.reason.defaultCareful";
  }

  if (fboPressure >= 65 && scalingMode === "scale") {
    safetyLevel = "cautious";
    scalingMode = "scale_carefully";
    mainReasonKey = "ssf.reason.fboBurden";
  }

  const allowedActionKeys: string[] = [];
  const forbiddenActionKeys: string[] = [];

  if (scalingMode === "scale") {
    allowedActionKeys.push("ssf.allow.heroSupport", "ssf.allow.controlledExpansion");
  } else if (scalingMode === "scale_carefully") {
    allowedActionKeys.push("ssf.allow.heroSupport", "ssf.allow.smallBatches");
    forbiddenActionKeys.push("ssf.forbid.heavyExpansion");
  } else if (scalingMode === "refresh_only") {
    allowedActionKeys.push("ssf.allow.refreshVisual", "ssf.allow.seoFix");
    forbiddenActionKeys.push("ssf.forbid.expansion", "ssf.forbid.fboScale");
  } else if (scalingMode === "cleanup_first") {
    allowedActionKeys.push("ssf.allow.dataHygiene", "ssf.allow.seoCluster");
    forbiddenActionKeys.push("ssf.forbid.launchWaves", "ssf.forbid.expansion");
  } else if (scalingMode === "hold_expansion") {
    allowedActionKeys.push("ssf.allow.heroSupport", "ssf.allow.refresh");
    forbiddenActionKeys.push("ssf.forbid.expansion", "ssf.forbid.fboScale");
  } else {
    allowedActionKeys.push("ssf.allow.reviewEconomics");
    forbiddenActionKeys.push("ssf.forbid.allScaling", "ssf.forbid.adsUp");
  }

  let recommendedNextStepKey = "ssf.next.reviewModules";
  if (scalingMode === "scale") recommendedNextStepKey = "ssf.next.proceedLaunch";
  else if (scalingMode === "scale_carefully") recommendedNextStepKey = "ssf.next.smallSteps";
  else if (scalingMode === "refresh_only") recommendedNextStepKey = "ssf.next.heroRefresh";
  else if (scalingMode === "cleanup_first") recommendedNextStepKey = "ssf.next.fixData";
  else if (scalingMode === "hold_expansion") recommendedNextStepKey = "ssf.next.fixEconomics";
  else recommendedNextStepKey = "ssf.next.stopReview";

  return {
    id: existingId ?? newScalingSafetyReportId(),
    createdAt: Date.now(),
    targetLabel: ctx.targetLabel,
    corridor: ctx.corridor,
    marketplace: ctx.marketplace,
    stockMode: ctx.stockMode,
    safetyLevel,
    scalingMode,
    mainReasonKey,
    mainReasonVars: vars,
    supportingSignalKeys: [...new Set(supportingSignalKeys)].slice(0, 8),
    blockedByKeys: [...new Set(blockedByKeys)].slice(0, 6),
    allowedActionKeys: [...new Set(allowedActionKeys)].slice(0, 6),
    forbiddenActionKeys: [...new Set(forbiddenActionKeys)].slice(0, 6),
    recommendedNextStepKey,
    recommendedNextStepVars: vars,
    confidenceNoteKey: "ssf.confidence.manual",
  };
}
