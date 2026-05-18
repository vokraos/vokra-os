import type { AssortmentAction } from "../assortment-actions/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { AdPressureGatherContext, AdvertisingPressureReport } from "./types";
import { levelRank, worstLevel } from "./levels";
import { computeAdDependencyLevel } from "./dependency";
import { computeExpansionAdLevel, computeLaunchAdLevel, computeUnsafeAdSpendLevel } from "./launch";
import { computeRefreshAdLevel } from "./refresh";
import { computeSaturationAdLevel } from "./saturation";
import { computeHeroAdDependency } from "./dependency";
import { newAdvertisingPressureReportId } from "./levels";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildAdvertisingPressureReport(
  ctx: AdPressureGatherContext,
  existingId?: string,
): AdvertisingPressureReport {
  const resolved = ctx.launchEcon;
  const adDependencyLevel = computeAdDependencyLevel(resolved, ctx);
  const launchAdPressure = computeLaunchAdLevel(ctx, resolved);
  const refreshAdPressure = computeRefreshAdLevel(ctx);
  const saturationPressure = computeSaturationAdLevel(ctx);
  const unsafeAdSpendRisk = computeUnsafeAdSpendLevel(resolved);
  const expansionAdRisk = computeExpansionAdLevel(ctx, resolved);
  const heroAdDependency = computeHeroAdDependency(resolved, ctx);

  const vars: Record<string, string> = {
    corridor: ctx.corridor,
    marketplace: ctx.marketplace,
    stockMode: ctx.stockMode,
    ad: resolved ? String(Math.round(resolved.profile.adCostEstimate)) : "—",
    maxAd: resolved ? String(Math.round(resolved.calculated.maxAdCostBeforeTargetBreak)) : "—",
    margin: resolved ? String(Math.round(resolved.calculated.estimatedMarginPercent)) : "—",
  };

  const warningKeys: string[] = [];
  if (unsafeAdSpendRisk === "dangerous" || unsafeAdSpendRisk === "critical") {
    warningKeys.push("adp.warn.unsafeSpend");
  }
  if (launchAdPressure === "dangerous" || launchAdPressure === "critical") {
    warningKeys.push("adp.warn.launchBurn");
  }
  if (refreshAdPressure === "elevated" || refreshAdPressure === "dangerous" || refreshAdPressure === "critical") {
    warningKeys.push("adp.warn.refreshBurden");
  }
  if (saturationPressure === "elevated" || saturationPressure === "dangerous" || saturationPressure === "critical") {
    warningKeys.push("adp.warn.corridorSaturation");
  }
  if (expansionAdRisk === "dangerous" || expansionAdRisk === "critical") {
    warningKeys.push("adp.warn.expansionAdRisk");
  }
  if (heroAdDependency === "dangerous" || heroAdDependency === "critical") {
    warningKeys.push("adp.warn.heroAdDependency");
  }
  if (adDependencyLevel === "dangerous" || adDependencyLevel === "critical") {
    warningKeys.push("adp.warn.adDependency");
  }

  const worst = worstLevel([
    adDependencyLevel,
    launchAdPressure,
    refreshAdPressure,
    saturationPressure,
    unsafeAdSpendRisk,
    expansionAdRisk,
    heroAdDependency,
  ]);

  let recommendedActionKey = "adp.action.manageable";
  if (worst === "critical") recommendedActionKey = "adp.action.criticalReview";
  else if (worst === "dangerous") recommendedActionKey = "adp.action.reduceBurn";
  else if (unsafeAdSpendRisk === "elevated" || unsafeAdSpendRisk === "dangerous") recommendedActionKey = "adp.action.capAds";
  else if (expansionAdRisk === "elevated" || expansionAdRisk === "dangerous") recommendedActionKey = "adp.action.holdExpansionAds";
  else if (heroAdDependency === "elevated" || heroAdDependency === "dangerous") recommendedActionKey = "adp.action.heroOrganicFirst";
  else if (refreshAdPressure === "elevated" || refreshAdPressure === "dangerous") recommendedActionKey = "adp.action.lightenRefreshAds";

  return {
    id: existingId ?? newAdvertisingPressureReportId(),
    createdAt: Date.now(),
    corridor: ctx.corridor,
    marketplace: ctx.marketplace,
    stockMode: ctx.stockMode,
    adDependencyLevel,
    launchAdPressure,
    refreshAdPressure,
    saturationPressure,
    unsafeAdSpendRisk,
    expansionAdRisk,
    heroAdDependency,
    recommendedActionKey,
    recommendedActionVars: vars,
    warningKeys: [...new Set(warningKeys)].slice(0, 8),
    confidenceNoteKey: "adp.confidence.manual",
  };
}

export function reportToDisplay(report: AdvertisingPressureReport, t: TFn): {
  recommendedAction: string;
  warnings: string[];
  confidenceNote: string;
} {
  return {
    recommendedAction: t(report.recommendedActionKey, report.recommendedActionVars),
    warnings: report.warningKeys.map((k) => t(k, report.recommendedActionVars)),
    confidenceNote: t(report.confidenceNoteKey),
  };
}

export function mergeAdvertisingHintsIntoLaunchRecommendations(
  plan: MarketplaceLaunchPlan,
  report: AdvertisingPressureReport | null,
  t: TFn,
): MarketplaceLaunchPlan {
  if (!report || levelRank(report.adDependencyLevel) < 3) return plan;
  const lines = reportToDisplay(report, t);
  const recommendations = [...plan.recommendations];
  const operationalWarnings = [...plan.operationalWarnings];
  const stopConditions = [...plan.stopConditions];

  if (levelRank(report.unsafeAdSpendRisk) >= 4) {
    const stop = t("adp.launch.stopUnsafe", { corridor: report.corridor });
    if (!stopConditions.includes(stop)) stopConditions.push(stop);
  }
  if (!recommendations.includes(lines.recommendedAction)) recommendations.push(lines.recommendedAction);
  for (const w of lines.warnings.slice(0, 2)) {
    const line = t("adp.launch.warn", { text: w });
    if (!operationalWarnings.includes(line)) operationalWarnings.push(line);
  }

  let expansionWave = plan.expansionWave;
  if (levelRank(report.expansionAdRisk) >= 4) {
    expansionWave = { ...expansionWave, status: "hold", reason: t("adp.launch.holdExpansionAds") };
    recommendations.push(t("adp.launch.reviewBeforeScaling"));
  }

  return {
    ...plan,
    recommendations: recommendations.slice(0, 14),
    operationalWarnings: [...new Set(operationalWarnings)].slice(0, 10),
    stopConditions: [...new Set(stopConditions)].slice(0, 12),
    expansionWave,
  };
}

export function augmentAssortmentWithAdPressure(
  action: AssortmentAction,
  report: AdvertisingPressureReport | null,
): Partial<Pick<AssortmentAction, "riskReasons" | "titleVars">> {
  if (!report || levelRank(report.adDependencyLevel) < 3) return {};

  const riskReasons = [...action.riskReasons];
  const titleVars = {
    ...action.titleVars,
    adpLevel: report.adDependencyLevel,
    adpCorridor: report.corridor,
  };

  const depKey = "aa.explain.risk.adDependency";
  if (!riskReasons.includes(depKey)) riskReasons.push(depKey);

  if (levelRank(report.unsafeAdSpendRisk) >= 3) {
    const k = "aa.explain.risk.unsafeLaunchAds";
    if (!riskReasons.includes(k)) riskReasons.push(k);
  }
  if (levelRank(report.saturationPressure) >= 3) {
    const k = "aa.explain.risk.saturationAdBurden";
    if (!riskReasons.includes(k)) riskReasons.push(k);
  }

  return { riskReasons: riskReasons.slice(0, 8), titleVars };
}

export function formatAdvertisingPressureFounderLine(report: AdvertisingPressureReport | null, t: TFn): string | null {
  if (!report || levelRank(report.adDependencyLevel) < 4) return null;
  return t("adp.founder.line", {
    level: t(`adp.level.${report.adDependencyLevel}`),
    corridor: report.corridor,
  });
}

export function formatAdvertisingPressureDailyLine(reports: AdvertisingPressureReport[], t: TFn): string | null {
  const ranked = [...reports].sort((a, b) => levelRank(b.adDependencyLevel) - levelRank(a.adDependencyLevel));
  const top = ranked.find((r) => levelRank(r.adDependencyLevel) >= 4);
  if (!top) return null;
  const display = reportToDisplay(top, t);
  return t("adp.daily.line", {
    level: t(`adp.level.${top.adDependencyLevel}`),
    corridor: top.corridor,
    action: display.recommendedAction,
  });
}
