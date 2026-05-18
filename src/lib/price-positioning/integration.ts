import type { AssortmentAction } from "../assortment-actions/types";
import type { EconomicGuardrail } from "../economic-guardrails/types";
import type { MarketplaceLaunchPlan, LaunchReadinessLevel } from "../launch-ops/types";
import { buildPricePositioningForContext } from "./resolve";
import type { PricePositioningReport, PricePressureLevel } from "./types";
import type { UnitEconomicsMatchContext } from "../unit-economics/types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function reportToResolvedLines(report: PricePositioningReport, t: TFn): {
  recommendedAction: string;
  warnings: string[];
  confidenceNote: string;
} {
  return {
    recommendedAction: t(report.recommendedPriceActionKey, report.recommendedPriceActionVars),
    warnings: report.warningKeys.map((k) => t(k, report.recommendedPriceActionVars)),
    confidenceNote: t(report.confidenceNoteKey),
  };
}

export function augmentAssortmentWithPricePressure(
  action: AssortmentAction,
  report: PricePositioningReport | null,
): Partial<Pick<AssortmentAction, "riskReasons" | "titleVars">> {
  if (!report || report.pricePressureLevel === "safe") return {};

  const riskReasons = [...action.riskReasons];
  const titleVars = {
    ...action.titleVars,
    pprLevel: report.pricePressureLevel,
    pprMarginGap: String(report.marginGap),
    pprAdGap: String(report.adSafetyGap),
  };

  const pressureKey = "aa.explain.risk.pricePressure";
  if (!riskReasons.includes(pressureKey)) riskReasons.push(pressureKey);

  if (report.adSafetyGap < 0) {
    const adKey = "aa.explain.risk.adSafetyGap";
    if (!riskReasons.includes(adKey)) riskReasons.push(adKey);
  }

  if (report.marginGap < -1) {
    const tgtKey = "aa.explain.risk.targetPriceNotReached";
    if (!riskReasons.includes(tgtKey)) riskReasons.push(tgtKey);
  }

  return { riskReasons: riskReasons.slice(0, 8), titleVars };
}

function downgradeReadiness(level: LaunchReadinessLevel): LaunchReadinessLevel {
  if (level === "expansion_ready") return "operational";
  if (level === "ready") return "fragile";
  if (level === "operational") return "fragile";
  return level;
}

export function applyPricePressureToLaunchPlan(
  plan: MarketplaceLaunchPlan,
  report: PricePositioningReport | null,
  t: TFn,
): MarketplaceLaunchPlan {
  if (!report || report.pricePressureLevel === "safe" || report.pricePressureLevel === "watch") return plan;

  const lines = reportToResolvedLines(report, t);
  const stopConditions = [...plan.stopConditions];
  const recommendations = [...plan.recommendations];
  const operationalWarnings = [...plan.operationalWarnings];

  const stop = t("ppr.launch.stop", { level: t(`ppr.level.${report.pricePressureLevel}`) });
  if (!stopConditions.includes(stop)) stopConditions.push(stop);
  if (!recommendations.includes(lines.recommendedAction)) recommendations.push(lines.recommendedAction);
  for (const w of lines.warnings.slice(0, 3)) {
    const line = t("ppr.launch.warn", { text: w });
    if (!operationalWarnings.includes(line)) operationalWarnings.push(line);
  }

  let launchReadiness = plan.launchReadiness;
  let launchReadinessScore = plan.launchReadinessScore;
  let expansionWave = plan.expansionWave;

  if (report.pricePressureLevel === "negative" || report.pricePressureLevel === "dangerous") {
    launchReadinessScore = Math.min(launchReadinessScore, 46);
    launchReadiness = downgradeReadiness(launchReadiness);
    expansionWave = { ...expansionWave, status: "hold", reason: t("ppr.launch.holdExpansion") };
    recommendations.push(t("ppr.launch.reviewBeforeFbo"));
  }

  return {
    ...plan,
    stopConditions: [...new Set(stopConditions)].slice(0, 12),
    recommendations: recommendations.slice(0, 14),
    operationalWarnings: [...new Set(operationalWarnings)].slice(0, 10),
    launchReadiness,
    launchReadinessScore,
    expansionWave,
  };
}

export function appendPricePressureToGuardrails(
  guardrails: EconomicGuardrail[],
  report: PricePositioningReport | null,
  _t: TFn,
): EconomicGuardrail[] {
  if (!report || report.pricePressureLevel === "safe") return guardrails;
  const out = [...guardrails];
  const add = (type: EconomicGuardrail["guardrailType"], severity: EconomicGuardrail["severity"], titleKey: string) => {
    const g: EconomicGuardrail = {
      id: `egr-ppr-${report.id}-${type}`,
      sourceProfileId: report.sourceEconomicsProfileId ?? report.id,
      corridor: report.targetLabel,
      productFamily: "",
      marketplace: report.marketplace,
      stockMode: report.stockMode,
      guardrailType: type,
      severity,
      titleKey,
      titleVars: report.recommendedPriceActionVars,
      reasonKey: report.warningKeys[0] ?? "ppr.warn.belowTargetMargin",
      reasonVars: report.recommendedPriceActionVars,
      recommendedActionKey: report.recommendedPriceActionKey,
      recommendedActionVars: report.recommendedPriceActionVars,
      affectedSystems: ["launch_operations", "assortment_actions", "unit_economics"],
      confidenceNoteKey: "ppr.confidence.manual",
      createdAt: Date.now(),
    };
    if (!out.some((x) => x.id === g.id)) out.push(g);
  };

  if (report.pricePressureLevel === "negative" || report.pricePressureLevel === "dangerous") {
    add("require_price_review", report.pricePressureLevel === "negative" ? "critical" : "elevated", "egr.title.requirePriceReview");
    add("reduce_ads", "elevated", "egr.title.reduceAds");
  }
  if (report.premiumProofRequired) {
    add("require_price_review", "caution", "ppr.title.premiumProof");
  }
  return out.slice(0, 16);
}

export function formatPricePressureDailyLine(
  reports: PricePositioningReport[],
  t: TFn,
): string | null {
  const ranked = [...reports].sort(
    (a, b) => pressureRank(b.pricePressureLevel) - pressureRank(a.pricePressureLevel),
  );
  const top = ranked.find((r) => r.pricePressureLevel !== "safe");
  if (!top) return null;
  const lines = reportToResolvedLines(top, t);
  return t("ppr.daily.line", {
    level: t(`ppr.level.${top.pricePressureLevel}`),
    label: top.targetLabel,
    action: lines.recommendedAction,
  });
}

export function formatPricePressureFounderLine(report: PricePositioningReport | null, t: TFn): string | null {
  if (!report || report.pricePressureLevel === "safe" || report.pricePressureLevel === "watch") return null;
  return t("ppr.founder.line", {
    level: t(`ppr.level.${report.pricePressureLevel}`),
    label: report.targetLabel,
  });
}

export function getCollectionPricePressureHint(
  report: PricePositioningReport | null,
  t: TFn,
): string | null {
  if (!report || report.pricePressureLevel === "safe") return null;
  const lines = reportToResolvedLines(report, t);
  return t("ppr.collection.hint", {
    level: t(`ppr.level.${report.pricePressureLevel}`),
    label: report.targetLabel,
    action: lines.recommendedAction,
  });
}

function pressureRank(level: PricePressureLevel): number {
  if (level === "negative") return 5;
  if (level === "dangerous") return 4;
  if (level === "tight") return 3;
  if (level === "watch") return 2;
  return 1;
}

export function buildLaunchPriceReport(matchCtx: UnitEconomicsMatchContext): PricePositioningReport | null {
  return buildPricePositioningForContext(matchCtx);
}
