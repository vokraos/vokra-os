import { pickCapacityBreachComparison } from "./capacity-interpret";
import type { ProductionDailyPlan } from "./daily-plan-types";
import { getActiveShiftScenario, loadShiftScenariosState } from "./shift-store";
import type { ProductionPressureReport } from "./types";
import { getProductionShiftLearning } from "./shift-feedback-learning";

type TFn = (key: string, vars?: Record<string, string>) => string;

function newPlanId(): string {
  return `pdp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pushUnique(list: string[], key: string, max = 8): void {
  if (!list.includes(key)) list.push(key);
  if (list.length > max) list.length = max;
}

function metricOverloaded(report: ProductionPressureReport, id: string): boolean {
  return report.capacity.comparisons.some((c) => c.metricId === id && c.state === "overloaded");
}

function metricPressured(report: ProductionPressureReport, id: string): boolean {
  return report.capacity.comparisons.some(
    (c) => c.metricId === id && (c.state === "overloaded" || c.state === "pressured"),
  );
}

export function deriveProductionDailyPlan(
  report: ProductionPressureReport,
  _t: TFn,
  existingId?: string,
): ProductionDailyPlan {
  const load = report.loadSnapshot;
  const sr = report.shiftRequirement;
  const learning = report.shiftLearning ?? getProductionShiftLearning();
  const active = getActiveShiftScenario();
  const shiftState = loadShiftScenariosState();
  const recommended = shiftState.scenarios.find((s) => s.id === sr.recommendedScenarioId);
  const activeType = report.capacity.shiftScenarioType ?? active?.scenarioType ?? null;
  const requiredType =
    recommended?.scenarioType ??
    sr.reasonVars.to ??
    (sr.recommendationType === "use_launch_day"
      ? "launch_day"
      : sr.recommendationType === "use_fbo_prep_day"
        ? "fbo_prep_day"
        : sr.recommendationType === "use_strong_shift"
          ? "strong_shift"
          : sr.recommendationType === "switch_scenario" && sr.reasonVars.to
            ? sr.reasonVars.to
            : null);

  const doFirst: string[] = [];
  const delay: string[] = [];
  const avoid: string[] = [];
  const bottleneckWatch: string[] = [];
  const capacityNotes: string[] = [];
  const reportBackQuestions: string[] = [];

  const launchStress =
    metricOverloaded(report, "activeLaunches") ||
    report.launchLoad.band === "high" ||
    report.launchLoad.band === "critical";
  const fboStress = metricOverloaded(report, "fboPrepTasks") || metricPressured(report, "fboPrepTasks");
  const visualStress =
    metricOverloaded(report, "visualJobs") ||
    metricOverloaded(report, "cardJobs") ||
    metricPressured(report, "visualJobs");
  const packStress =
    metricOverloaded(report, "packagingLoad") ||
    report.packagingPressure.band === "high" ||
    report.packagingPressure.band === "critical";
  const refreshStress = metricPressured(report, "refreshTasks");
  const blockedStress = load.blockedTasks > 0 || metricOverloaded(report, "blockedTasks");
  const waveStress =
    report.waveCollisionRisk.band === "high" || report.waveCollisionRisk.band === "critical";

  let todayFocus = "prod.plan.focus.stable";
  const todayFocusVars: Record<string, string> = {
    state: report.productionState,
    active: activeType ?? "—",
    required: requiredType ?? "—",
  };

  if (
    sr.recommendationType === "reduce_workload" ||
    sr.recommendationType === "split_workload"
  ) {
    todayFocus = "prod.plan.focus.reduce";
    pushUnique(doFirst, "prod.plan.do.reduceBatch");
    pushUnique(delay, "prod.plan.delay.allExpansion");
    pushUnique(avoid, "prod.plan.avoid.newLaunches");
    for (const r of sr.workloadReductions.slice(0, 4)) pushUnique(doFirst, r);
  } else if (fboStress && !launchStress) {
    todayFocus = "prod.plan.focus.fbo";
    pushUnique(doFirst, "prod.plan.do.fboPrep");
    pushUnique(doFirst, "prod.plan.do.fboMaterials");
    pushUnique(delay, "prod.plan.delay.newLaunches");
    pushUnique(delay, "prod.plan.delay.refresh");
    pushUnique(avoid, "prod.plan.avoid.launchWave");
  } else if (launchStress) {
    todayFocus = "prod.plan.focus.launch";
    pushUnique(doFirst, "prod.plan.do.launchCritical");
    pushUnique(doFirst, "prod.plan.do.packagingReady");
    pushUnique(delay, "prod.plan.delay.refresh");
    pushUnique(delay, "prod.plan.delay.heroTests");
    pushUnique(avoid, "prod.plan.avoid.parallelWaves");
  } else if (visualStress) {
    todayFocus = "prod.plan.focus.visual";
    pushUnique(doFirst, "prod.plan.do.clearVisualQueue");
    pushUnique(doFirst, "prod.plan.do.trimHeroVariants");
    pushUnique(delay, "prod.plan.delay.newVisualTests");
    pushUnique(avoid, "prod.plan.avoid.extraVariants");
  } else if (packStress) {
    todayFocus = "prod.plan.focus.packaging";
    pushUnique(doFirst, "prod.plan.do.packagingBlockers");
    pushUnique(doFirst, "prod.plan.do.cardDraftTriage");
    pushUnique(delay, "prod.plan.delay.expansion");
    pushUnique(avoid, "prod.plan.avoid.expansion");
  } else if (report.productionState === "pressured") {
    todayFocus = "prod.plan.focus.cautious";
    pushUnique(doFirst, "prod.plan.do.triageOpen");
    pushUnique(delay, "prod.plan.delay.lowPriority");
  }

  if (learning.repeatedMismatch && learning.repeatCount >= 2) {
    pushUnique(capacityNotes, "prod.learn.plan.note");
    if (learning.nextShiftHintKey) pushUnique(capacityNotes, learning.nextShiftHintKey);
    for (const r of learning.recommendationKeys.slice(0, 2)) pushUnique(doFirst, r);
  }

  if (sr.recommendationType === "use_launch_day") {
    pushUnique(capacityNotes, "prod.plan.cap.launchDay");
  } else if (sr.recommendationType === "use_fbo_prep_day") {
    pushUnique(capacityNotes, "prod.plan.cap.fboPrepDay");
  } else if (sr.recommendationType === "use_strong_shift") {
    pushUnique(capacityNotes, "prod.plan.cap.strongShift");
  } else if (
    sr.recommendationType === "switch_scenario" &&
    requiredType
  ) {
    pushUnique(capacityNotes, "prod.plan.cap.switchScenario");
    todayFocusVars.required = requiredType;
  } else if (sr.recommendationType === "keep_current" && activeType) {
    pushUnique(capacityNotes, "prod.plan.cap.keepScenario");
  }

  if (blockedStress) {
    pushUnique(doFirst, "prod.plan.do.unblockTasks");
    pushUnique(bottleneckWatch, "prod.plan.watch.blocked");
  }
  if (refreshStress && launchStress) {
    pushUnique(delay, "prod.plan.delay.refresh");
  }
  if (waveStress) {
    pushUnique(avoid, "prod.plan.avoid.parallelWaves");
    pushUnique(bottleneckWatch, "prod.plan.watch.waveCollision");
  }
  if (report.cadenceStability.band === "high" || report.cadenceStability.band === "critical") {
    pushUnique(bottleneckWatch, "prod.plan.watch.cadence");
  }

  const breach = pickCapacityBreachComparison(report.capacity);
  if (breach && breach.state !== "stable" && breach.state !== "unknown") {
    pushUnique(bottleneckWatch, breach.summaryKey);
  }

  for (const b of report.operatorBottlenecks.slice(0, 3)) {
    pushUnique(bottleneckWatch, b.labelKey);
  }

  for (const z of report.dangerousZones.slice(0, 2)) {
    pushUnique(avoid, z);
  }
  for (const f of report.forbiddenMoves.slice(0, 3)) {
    pushUnique(avoid, f);
  }

  if (!doFirst.length) pushUnique(doFirst, "prod.plan.do.triageOpen");
  if (!delay.length && report.productionState !== "stable") {
    pushUnique(delay, "prod.plan.delay.lowPriority");
  }

  pushUnique(reportBackQuestions, "prod.plan.report.packaging");
  pushUnique(reportBackQuestions, "prod.plan.report.blockers");
  if (launchStress) pushUnique(reportBackQuestions, "prod.plan.report.launch");
  if (fboStress) pushUnique(reportBackQuestions, "prod.plan.report.fbo");
  if (visualStress) pushUnique(reportBackQuestions, "prod.plan.report.visual");
  if (
    sr.recommendationType === "reduce_workload" ||
    sr.recommendationType === "split_workload"
  ) {
    pushUnique(reportBackQuestions, "prod.plan.report.overload");
  }

  let confidenceNote = "prod.plan.confidence.ok";
  if (!report.capacity.hasProfile) confidenceNote = "prod.plan.confidence.noProfile";
  else if (report.productionState === "blocked" || report.productionState === "overloaded") {
    confidenceNote = "prod.plan.confidence.heavy";
  } else if (sr.recommendationType !== "keep_current") {
    confidenceNote = "prod.plan.confidence.shift";
  }

  return {
    id: existingId ?? newPlanId(),
    createdAt: Date.now(),
    sourceReportId: report.id,
    activeScenario: activeType,
    requiredScenario: requiredType,
    productionState: report.productionState,
    todayFocus,
    todayFocusVars,
    doFirst: doFirst.slice(0, 8),
    delay: delay.slice(0, 6),
    avoid: avoid.slice(0, 6),
    bottleneckWatch: bottleneckWatch.slice(0, 6),
    capacityNotes: capacityNotes.slice(0, 5),
    reportBackQuestions: reportBackQuestions.slice(0, 6),
    confidenceNote,
  };
}
