import type { AssortmentAction, AssortmentActionType } from "../assortment-actions/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import type { StrategicControlTowerSnapshot } from "../strategic-control-tower/types";
import { pickCapacityBreachComparison } from "./capacity-interpret";
import { formatProductionDailyPlanCompactLine } from "./daily-plan-export";
import { buildProductionPressureReport } from "./digest";
import { getProductionShiftLearning } from "./shift-feedback-learning";
import { pickProductionPressureDigestLine } from "./recommendations";
import { peekProductionPressureSession } from "./session";
import type { ProductionPressureReport } from "./types";
import type { ShiftRequirementType } from "./shift-requirement-types";

type TFn = (key: string, vars?: Record<string, string>) => string;

const EXPANSION_ACTIONS: AssortmentActionType[] = [
  "launch_wave",
  "create_collection",
  "split_marketplace_group",
  "promote_hero_candidate",
  "prepare_fbo",
];

function expansionAction(a: AssortmentAction): boolean {
  return EXPANSION_ACTIONS.includes(a.actionType);
}

export function shouldProductionPressureHoldAction(
  action: AssortmentAction,
  report: ProductionPressureReport | null,
): boolean {
  if (!report) return false;
  if (report.capacity.hasProfile && report.capacity.overallState === "overloaded") {
    if (expansionAction(action) || action.actionType === "prepare_fbo") return true;
  }
  const state = report.productionState;
  if (state === "blocked") return expansionAction(action) || action.actionType === "prepare_fbo";
  if (state === "overloaded" || state === "unstable") return expansionAction(action);
  if (state === "pressured" && report.launchLoad.band === "high") return action.actionType === "launch_wave";
  return false;
}

export function augmentAssortmentWithProductionPressure(
  action: AssortmentAction,
  report: ProductionPressureReport | null,
): Partial<
  Pick<
    AssortmentAction,
    | "riskReasons"
    | "titleVars"
    | "productionPressureHold"
    | "productionPressureBadgeKey"
    | "productionPressureState"
    | "productionShiftScenarioType"
  >
> {
  if (!report) return {};
  const capOverload = report.capacity.hasProfile && report.capacity.overallState === "overloaded";
  const shiftPressured =
    !!report.capacity.shiftScenarioType &&
    (report.capacity.overallState === "pressured" || report.capacity.overallState === "overloaded");
  if (report.productionState === "stable" && !capOverload && !shiftPressured) return {};

  const riskReasons = [...action.riskReasons];
  const explainKey = "aa.explain.risk.productionPressure";
  if (!riskReasons.includes(explainKey)) riskReasons.push(explainKey);
  if (report.capacity.shiftScenarioType) {
    const shiftKey = "aa.explain.risk.productionShift";
    if (!riskReasons.includes(shiftKey)) riskReasons.push(shiftKey);
  }

  const sr = report.shiftRequirement;
  const needsShiftScenario =
    sr.recommendationType !== "keep_current" &&
    sr.recommendationType !== "reduce_workload" &&
    sr.recommendationType !== "split_workload" &&
    (expansionAction(action) ||
      (sr.recommendationType === "use_fbo_prep_day" && action.actionType === "prepare_fbo"));
  if (needsShiftScenario) {
    const shiftKey = "aa.explain.risk.shiftRequirement";
    if (!riskReasons.includes(shiftKey)) riskReasons.push(shiftKey);
  }

  const productionPressureHold = shouldProductionPressureHoldAction(action, report);

  return {
    riskReasons: riskReasons.slice(0, 8),
    titleVars: {
      ...action.titleVars,
      prodState: report.productionState,
      prodPack: report.packagingPressure.band,
      prodShift: report.capacity.shiftScenarioType ?? "",
      shiftReq: sr.recommendationType,
      shiftReqScenario: sr.reasonVars.to ?? "",
    },
    productionPressureHold,
    productionPressureBadgeKey: report.capacity.shiftScenarioType
      ? "aa.production.shiftBadge"
      : "aa.production.badge",
    productionPressureState: report.productionState,
    productionShiftScenarioType: report.capacity.shiftScenarioType ?? undefined,
  };
}

export function applyProductionPressureToLaunchPlan(
  plan: MarketplaceLaunchPlan,
  report: ProductionPressureReport | null,
  t: TFn,
): MarketplaceLaunchPlan {
  if (!report) return plan;

  const shiftType = report.capacity.shiftScenarioType;
  const structuralQuiet = report.productionState === "stable" && !shiftType;
  if (structuralQuiet) return plan;

  const banner = shiftType
    ? t("prod.launch.shiftBanner", {
        shift: t(`prod.shift.type.${shiftType}`),
        state: t(`prod.state.${report.productionState}`),
      })
    : t("prod.launch.banner", {
        state: t(`prod.state.${report.productionState}`),
      });

  const operationalWarnings =
    report.productionState === "stable" ? [...plan.operationalWarnings] : [banner, ...plan.operationalWarnings];
  const recommendations = [...plan.recommendations];
  const stopConditions = [...plan.stopConditions];

  if (shiftType === "fbo_prep_day") {
    const fboLine = t("prod.launch.fboPrepDay");
    if (!recommendations.includes(fboLine)) recommendations.push(fboLine);
  }
  if (shiftType === "small_shift") {
    const smallLine = t("prod.launch.smallShift");
    if (!operationalWarnings.includes(smallLine)) operationalWarnings.unshift(smallLine);
  }
  if (shiftType === "launch_day") {
    const launchLine = t("prod.launch.launchDay");
    if (!recommendations.includes(launchLine)) recommendations.push(launchLine);
  }

  const shiftReq = report.shiftRequirement;
  if (shiftReq.recommendationType === "use_launch_day") {
    const line = t("prod.shiftReq.launch.banner");
    if (!recommendations.includes(line)) recommendations.push(line);
  }
  if (shiftReq.recommendationType === "use_fbo_prep_day") {
    const line = t("prod.shiftReq.launch.fboBanner");
    if (!recommendations.includes(line)) recommendations.push(line);
  }
  if (
    shiftReq.recommendationType === "reduce_workload" ||
    shiftReq.recommendationType === "split_workload"
  ) {
    const line = t("prod.shiftReq.launch.reduceBanner");
    if (!operationalWarnings.includes(line)) operationalWarnings.unshift(line);
  }

  for (const key of report.dangerousZones.slice(0, 2)) {
    const line = t(key);
    if (!recommendations.includes(line)) recommendations.push(line);
  }

  let expansionWave = plan.expansionWave;
  let launchReadiness = plan.launchReadiness;
  let launchReadinessScore = plan.launchReadinessScore;

  if (shiftType === "small_shift") {
    launchReadinessScore = Math.min(launchReadinessScore, 50);
    if (launchReadiness === "expansion_ready" || launchReadiness === "ready") {
      launchReadiness = "fragile";
    }
  }

  if (report.productionState === "blocked" || report.productionState === "overloaded") {
    expansionWave = {
      ...expansionWave,
      status: "hold",
      reason: t("prod.launch.holdExpansion", { state: t(`prod.state.${report.productionState}`) }),
    };
    launchReadinessScore = Math.min(launchReadinessScore, report.productionState === "blocked" ? 40 : 48);
    if (launchReadiness === "expansion_ready" || launchReadiness === "ready") {
      launchReadiness = "fragile";
    }
  } else if (shiftType === "fbo_prep_day") {
    launchReadinessScore = Math.min(100, launchReadinessScore + 4);
  }

  if (report.waveCollisionRisk.band === "high" || report.waveCollisionRisk.band === "critical") {
    const stop = t("prod.launch.collisionStop");
    if (!stopConditions.includes(stop)) stopConditions.push(stop);
  }

  return {
    ...plan,
    operationalWarnings: [...new Set(operationalWarnings)].slice(0, 12),
    recommendations: recommendations.slice(0, 14),
    stopConditions: [...new Set(stopConditions)].slice(0, 12),
    expansionWave,
    launchReadiness,
    launchReadinessScore,
  };
}

export function reportToDisplay(
  report: ProductionPressureReport,
  t: TFn,
): {
  dangerousZones: string[];
  recommendedActions: string[];
  forbiddenMoves: string[];
  confidenceNote: string;
  bottlenecks: string[];
} {
  return {
    dangerousZones: report.dangerousZones.map((k) => t(k)),
    recommendedActions: report.recommendedActions.map((k) => t(k)),
    forbiddenMoves: report.forbiddenMoves.map((k) => t(k)),
    confidenceNote: t(report.confidenceNoteKey),
    bottlenecks: report.operatorBottlenecks.map((b) => t(b.labelKey, b.labelVars)),
  };
}

export function formatProductionDailyPlanFounderLine(report: ProductionPressureReport | null, t: TFn): string | null {
  if (!report?.dailyPlan) return null;
  return t("prod.plan.founder.line", {
    detail: formatProductionDailyPlanCompactLine(report.dailyPlan, t),
  });
}

export function formatProductionPressureFounderLine(report: ProductionPressureReport | null, t: TFn): string | null {
  const planLine = formatProductionDailyPlanFounderLine(report, t);
  if (planLine) return planLine;
  if (!report || report.productionState === "stable") return null;
  return t("prod.founder.line", {
    state: t(`prod.state.${report.productionState}`),
    zone: report.dangerousZones[0] ? t(report.dangerousZones[0]) : t("prod.zone.general"),
  });
}

export function formatProductionPressureDailyLine(report: ProductionPressureReport | null, t: TFn): string | null {
  const digest = report ? pickProductionPressureDigestLineForDaily(report) : null;
  if (!digest) return null;
  return t("prod.daily.line", {
    detail: t(digest.lineKey, digest.lineVars),
  });
}

function pickProductionPressureDigestLineForDaily(report: ProductionPressureReport): {
  lineKey: string;
  lineVars: Record<string, string>;
} | null {
  const capacityBreach = pickCapacityBreachComparison(report.capacity);
  if (capacityBreach && capacityBreach.state !== "stable" && capacityBreach.state !== "unknown") {
    return { lineKey: capacityBreach.summaryKey, lineVars: capacityBreach.summaryVars };
  }

  if (report.productionState === "stable") {
    if (report.launchLoad.band === "low" && report.cadenceStability.band === "low") {
      return { lineKey: "prod.digest.stableLaunch", lineVars: {} };
    }
    return null;
  }
  if (report.packagingPressure.band === "high" || report.packagingPressure.band === "critical") {
    return { lineKey: "prod.digest.packaging", lineVars: {} };
  }
  if (report.productionState === "overloaded" || report.productionState === "blocked") {
    return { lineKey: "prod.digest.overload", lineVars: { state: report.productionState } };
  }
  return { lineKey: "prod.digest.general", lineVars: { state: report.productionState } };
}

export function getLaunchOpsShiftRequirementHint(report: ProductionPressureReport | null, t: TFn): string | null {
  if (!report) return null;
  const sr = report.shiftRequirement;
  if (sr.recommendationType === "keep_current") return null;
  const scenarioLabel =
    sr.recommendedScenarioId && sr.reasonVars.to
      ? t(`prod.shift.type.${sr.reasonVars.to}`)
      : t(`prod.shiftReq.type.${sr.recommendationType}`);
  return t("prod.shiftReq.launch.hint", {
    type: t(`prod.shiftReq.type.${sr.recommendationType}`),
    scenario: scenarioLabel,
  });
}

export function getLaunchOpsProductionHint(report: ProductionPressureReport | null, t: TFn): string | null {
  const shiftHint = getLaunchOpsShiftRequirementHint(report, t);
  if (shiftHint) return shiftHint;
  if (!report || report.productionState === "stable") return null;
  return t("prod.launch.hint", { state: t(`prod.state.${report.productionState}`) });
}

export function getMarketTimingProductionHint(report: ProductionPressureReport | null, t: TFn): string | null {
  if (!report || report.cadenceStability.band === "low") return null;
  return t("prod.timing.hint", { state: t(`prod.state.${report.productionState}`) });
}

export type ControlTowerProductionSlice = {
  productionPressureLineKey: string | null;
  productionPressureLineVars: Record<string, string>;
};

export function formatCapacityDailyLine(report: ProductionPressureReport | null, t: TFn): string | null {
  const breach = report ? pickCapacityBreachComparison(report.capacity) : null;
  if (!breach || breach.state === "stable" || breach.state === "unknown") return null;
  return t("prod.capacity.daily.breach", {
    metric: t(breach.labelKey),
    state: t(`prod.capacity.state.${breach.state}`),
    current: String(breach.current),
    safe: breach.safe !== null ? String(breach.safe) : "—",
    max: breach.max !== null ? String(breach.max) : "—",
  });
}

export function formatShiftScenarioDailyLine(report: ProductionPressureReport | null, t: TFn): string | null {
  if (!report?.capacity.shiftScenarioType) return null;
  const scenario = t(`prod.shift.type.${report.capacity.shiftScenarioType}`);
  const breach = pickCapacityBreachComparison(report.capacity);
  const capState = report.capacity.overallState;
  if (breach && breach.state !== "stable" && breach.state !== "unknown") {
    return t("prod.shift.daily.line", {
      scenario,
      state: t(`prod.capacity.state.${breach.state}`),
      metric: t(breach.labelKey),
    });
  }
  if (capState === "pressured" || capState === "overloaded") {
    return t("prod.shift.daily.lineShort", {
      scenario,
      state: t(`prod.capacity.state.${capState}`),
    });
  }
  return null;
}

export function formatShiftRequirementDailyLine(report: ProductionPressureReport | null, t: TFn): string | null {
  if (!report) return null;
  const sr = report.shiftRequirement;
  if (sr.recommendationType === "keep_current") return null;
  if (sr.recommendationType === "reduce_workload" || sr.recommendationType === "split_workload") {
    return t("prod.shiftReq.daily.overload", {
      type: t(`prod.shiftReq.type.${sr.recommendationType}`),
    });
  }
  const scenario =
    sr.reasonVars.to && sr.recommendedScenarioId
      ? t(`prod.shift.type.${sr.reasonVars.to}`)
      : t(`prod.shiftReq.type.${sr.recommendationType}`);
  return t("prod.shiftReq.daily.needed", { scenario });
}

export function formatProductionDailyPlanDailyLine(report: ProductionPressureReport | null, t: TFn): string | null {
  if (!report?.dailyPlan) return null;
  return t("prod.plan.daily.prefix", {
    detail: formatProductionDailyPlanCompactLine(report.dailyPlan, t),
  });
}

export function formatProductionShiftLearningDailyLine(
  report: ProductionPressureReport | null,
  t: TFn,
): string | null {
  const learn = report?.shiftLearning ?? getProductionShiftLearning();
  if (!learn.digestLineKey || learn.repeatCount < 2) return null;
  return t("prod.learn.daily.line", learn.digestLineVars);
}

export function getProductionPressureDailyLine(t: TFn): string | null {
  const report = buildProductionPressureReport(t);
  const learnLine = formatProductionShiftLearningDailyLine(report, t);
  if (learnLine) return learnLine;
  const planLine = formatProductionDailyPlanDailyLine(report, t);
  if (planLine) return planLine;
  const reqLine = formatShiftRequirementDailyLine(report, t);
  if (reqLine) return reqLine;
  const shiftLine = formatShiftScenarioDailyLine(report, t);
  if (shiftLine) return shiftLine;
  const capacityLine = formatCapacityDailyLine(report, t);
  if (capacityLine) return capacityLine;
  return formatProductionPressureDailyLine(report, t);
}

/** Last saved production report only — does not compose a new report. */
export function getProductionPressureDailyLineCached(t: TFn): string | null {
  const report = peekProductionPressureSession()?.report ?? null;
  const learnLine = formatProductionShiftLearningDailyLine(report, t);
  if (learnLine) return learnLine;
  const planLine = formatProductionDailyPlanDailyLine(report, t);
  if (planLine) return planLine;
  const reqLine = formatShiftRequirementDailyLine(report, t);
  if (reqLine) return reqLine;
  const shiftLine = formatShiftScenarioDailyLine(report, t);
  if (shiftLine) return shiftLine;
  const capacityLine = formatCapacityDailyLine(report, t);
  if (capacityLine) return capacityLine;
  return formatProductionPressureDailyLine(report, t);
}

export function buildControlTowerProductionSlice(t: TFn): ControlTowerProductionSlice {
  const report = buildProductionPressureReport(t);
  const digest = pickProductionPressureDigestLine(report);
  if (!digest) return { productionPressureLineKey: null, productionPressureLineVars: {} };
  return {
    productionPressureLineKey: digest.lineKey,
    productionPressureLineVars: digest.lineVars,
  };
}

export function enrichControlTowerWithProductionPressure(
  tower: StrategicControlTowerSnapshot,
  t: TFn,
): StrategicControlTowerSnapshot & ControlTowerProductionSlice {
  const slice = buildControlTowerProductionSlice(t);
  const report = buildProductionPressureReport(t);
  const warningKeys = [...tower.warningKeys];
  for (const z of report.dangerousZones.slice(0, 2)) {
    if (!warningKeys.includes(z)) warningKeys.push(z);
  }
  const learning = report.shiftLearning ?? getProductionShiftLearning();
  if (learning.digestLineKey) {
    const learnWarn = "prod.learn.zone.capacity";
    if (!warningKeys.includes(learnWarn)) warningKeys.unshift(learnWarn);
  }
  return { ...tower, ...slice, warningKeys: [...new Set(warningKeys)].slice(0, 10) };
}

export function formatControlTowerProductionPressureLine(slice: ControlTowerProductionSlice, t: TFn): string | null {
  if (!slice.productionPressureLineKey) return null;
  const vars = slice.productionPressureLineVars;
  if (slice.productionPressureLineKey?.startsWith("prod.learn.digest.")) {
    return t(slice.productionPressureLineKey, vars);
  }
  if (slice.productionPressureLineKey === "prod.shiftReq.digest") {
    const type = vars.type as ShiftRequirementType | undefined;
    const scenarioType = vars.scenarioType as string | undefined;
    if (type === "reduce_workload" || type === "split_workload") {
      return t("prod.shiftReq.daily.overload", {
        type: t(`prod.shiftReq.type.${type}`),
      });
    }
    return t("prod.shiftReq.daily.needed", {
      scenario: scenarioType ? t(`prod.shift.type.${scenarioType}`) : t(`prod.shiftReq.type.${type ?? "switch_scenario"}`),
    });
  }
  if (slice.productionPressureLineKey.startsWith("prod.shift.digest.")) {
    return t(slice.productionPressureLineKey, {
      scenario: t(`prod.shift.type.${vars.scenario ?? "normal_shift"}`),
      state: t(`prod.capacity.state.${vars.state ?? "pressured"}`),
      metric: vars.metric ? t(`prod.capacity.metric.${vars.metric}`) : "",
    });
  }
  return t("prod.controlTower.line", {
    detail: t(slice.productionPressureLineKey, vars),
  });
}
