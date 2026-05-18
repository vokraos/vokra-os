import { newLaunchPlanId } from "./ids";
import { deriveLaunchBlockers } from "./blockers";
import { computeLaunchPressure } from "./pressure";
import { computeLaunchReadiness } from "./readiness";
import { deriveLaunchRecommendations, deriveOperationalWarnings } from "./recommendations";
import { buildEconomicPressureReport, gatherEconomicPressureContext, mergeEconomicHintsIntoLaunchRecommendations } from "../economic-pressure";
import { applyGuardrailsToLaunchPlan, guardrailContextFromPressure, loadEconomicGuardrails } from "../economic-guardrails";
import { buildPrimaryAdvertisingPressureReport, mergeAdvertisingHintsIntoLaunchRecommendations } from "../ad-pressure";
import { applyMarketTimingToLaunchPlan, buildPrimaryMarketTimingReport } from "../market-timing";
import { applyCorridorStrategyToLaunchPlan, buildPrimaryCorridorStrategyReport } from "../corridor-strategy";
import { applyFboFbsDecisionToLaunchPlan, buildFboFbsDecisionReport } from "../fbo-fbs-decision";
import { applyScalingSafetyToLaunchPlan, buildScalingSafetyReport } from "../scaling-safety";
import { applyProductionPressureToLaunchPlan, buildProductionPressureReport } from "../production-pressure";
import { appendPricePressureToGuardrails, applyPricePressureToLaunchPlan, buildLaunchPriceReport } from "../price-positioning";
import {
  formatResolvedSourceLine,
  loadBundleForIntegrations,
  mergeUnitEconomicsHintsIntoLaunchRecommendations,
  resolveUnitEconomics,
} from "../unit-economics";
import {
  adjustReadinessForReview,
  deriveReviewLearningFlags,
  mergeReviewIntoBlockers,
  mergeReviewIntoRecommendations,
} from "./review/learning";
import { deriveSaturationRisk } from "./saturation";
import { deriveLaunchTiming } from "./timing";
import { buildLaunchSequence } from "./sequencing";
import { buildLaunchWaves } from "./waves";
import type { LaunchOpsGatherContext, MarketplaceLaunchPlan } from "./types";

export function buildMarketplaceLaunchPlan(
  ctx: LaunchOpsGatherContext,
  t: (key: string, vars?: Record<string, string>) => string,
  existingId?: string,
): MarketplaceLaunchPlan | null {
  if (!ctx.collection || !ctx.pipeline) return null;

  const readinessBase = computeLaunchReadiness(ctx);
  const review = ctx.latestLaunchReview;
  const reviewFlags = review ? deriveReviewLearningFlags(review) : null;
  const { level, score } = adjustReadinessForReview(readinessBase.level, readinessBase.score, review);
  const pressure = computeLaunchPressure(ctx);
  const blockers = mergeReviewIntoBlockers(deriveLaunchBlockers(ctx, t), review, reviewFlags, t);
  const waves = buildLaunchWaves(ctx, level, t, review, reviewFlags);
  const sequence = buildLaunchSequence(waves.hero, waves.support, waves.expansion, waves.archiveRefresh, t);
  const stopConditions = [
    ...ctx.pipeline.structuredStops.filter((s) => s.active).map((s) => s.label),
    ...ctx.pipeline.executionRoute.stopConditions,
  ];

  const marketplace =
    ctx.heroLaunchPackage?.marketplace ?? ctx.collection.heroProducts[0]?.title ? "WB/Ozon" : "WB/Ozon";

  const econReport = buildEconomicPressureReport(gatherEconomicPressureContext(), t);
  let guardrails = loadEconomicGuardrails(guardrailContextFromPressure(econReport));
  const ueBundle = loadBundleForIntegrations();
  const launchEcon = resolveUnitEconomics(
    {
      collectionId: ctx.collection.id,
      corridor: ctx.collection.corridorId,
      marketplace,
      stockMode: "FBO",
    },
    ueBundle,
  );

  const priceReport = buildLaunchPriceReport({
    collectionId: ctx.collection.id,
    corridor: ctx.collection.corridorId,
    marketplace,
    stockMode: "FBO",
  });
  guardrails = appendPricePressureToGuardrails(guardrails, priceReport, t);

  const basePlan: MarketplaceLaunchPlan = {
    id: existingId ?? newLaunchPlanId(),
    collectionId: ctx.collection.id,
    collectionName: ctx.collection.name,
    createdAt: Date.now(),
    marketplace,
    launchReadiness: level,
    launchReadinessScore: score,
    launchPressure: pressure.launchPressure,
    launchRisk: ctx.pipeline.executionRoute.launchRisk || t("lops.risk.default"),
    launchTiming: deriveLaunchTiming(ctx, level, t),
    saturationRisk: deriveSaturationRisk(ctx, t),
    stopConditions: [...new Set(stopConditions)].slice(0, 8),
    blockers,
    recommendations: mergeUnitEconomicsHintsIntoLaunchRecommendations(
      mergeEconomicHintsIntoLaunchRecommendations(
        mergeReviewIntoRecommendations(
          deriveLaunchRecommendations(ctx, level, blockers, t),
          review,
          reviewFlags,
          t,
        ),
        econReport,
        t,
      ),
      ueBundle.profiles,
      t,
    ),
    heroWave: waves.hero,
    supportWave: waves.support,
    expansionWave: waves.expansion,
    archiveRefreshWave: waves.archiveRefresh,
    fboPressure: pressure.fboPressure,
    fbsPressure: pressure.fbsPressure,
    launchSequence: sequence,
    operationalWarnings: [
      ...deriveOperationalWarnings(ctx, pressure, t),
      ...(launchEcon
        ? [t("ue.launch.economicsSource", { source: formatResolvedSourceLine(launchEcon, t) })]
        : [t("ue.launch.noEconomics")]),
    ],
    heroLaunchPackageId: ctx.heroLaunchPackage?.id ?? null,
    linkedQuery: ctx.heroLaunchPackage?.query ?? null,
  };

  const adReport = buildPrimaryAdvertisingPressureReport();
  const withGuardrails = applyGuardrailsToLaunchPlan(basePlan, guardrails, t);
  const withPrice = applyPricePressureToLaunchPlan(withGuardrails, priceReport, t);
  const withAds = mergeAdvertisingHintsIntoLaunchRecommendations(withPrice, adReport, t);
  const ssfReport = buildScalingSafetyReport(t);
  const withScaling = applyScalingSafetyToLaunchPlan(withAds, ssfReport, t);
  const pprReport = buildProductionPressureReport(t);
  const withProduction = applyProductionPressureToLaunchPlan(withScaling, pprReport, t);
  const ffdReport = buildFboFbsDecisionReport(t);
  const withFbo = applyFboFbsDecisionToLaunchPlan(withProduction, ffdReport, t);
  const cstReport = buildPrimaryCorridorStrategyReport(t);
  const withCorridor = applyCorridorStrategyToLaunchPlan(withFbo, cstReport, t);
  const mtmReport = buildPrimaryMarketTimingReport(t);
  return applyMarketTimingToLaunchPlan(withCorridor, mtmReport, t);
}
