import { interpretCapacityLoad } from "./capacity-interpret";
import { resolveCapacitySnapshot, resolvedLimitsToProfile } from "./capacity-resolve";
import type {
  CapacityInterpretState,
  CapacityLoadMetricId,
  CapacityInterpretation,
  ProductionLoadSnapshot,
  ProductionShiftScenario,
  ShiftScenarioType,
} from "./capacity-types";
import type { ShiftRequirementRecommendation, ShiftRequirementType } from "./shift-requirement-types";
import { getActiveCapacityProfile } from "./capacity-store";
import { getProductionShiftLearning } from "./shift-feedback-learning";
import {
  getActiveShiftScenario,
  loadShiftScenariosState,
  resolveBaseProfileForScenario,
} from "./shift-store";

function newShiftRequirementId(): string {
  return `psr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type ScenarioEvaluation = {
  scenario: ProductionShiftScenario;
  capacity: CapacityInterpretation;
  score: number;
};

function rankState(s: CapacityInterpretState): number {
  if (s === "overloaded") return 3;
  if (s === "pressured") return 2;
  if (s === "stable") return 1;
  return 0;
}

function scoreEvaluation(capacity: CapacityInterpretation): number {
  let score = rankState(capacity.overallState) * 40;
  for (const c of capacity.comparisons) {
    if (c.state === "overloaded") score += 18;
    else if (c.state === "pressured") score += 7;
  }
  return score;
}

function evaluateScenario(
  load: ProductionLoadSnapshot,
  scenario: ProductionShiftScenario,
): ScenarioEvaluation | null {
  const profile = resolveBaseProfileForScenario(scenario) ?? getActiveCapacityProfile();
  if (!profile) return null;
  const resolved = resolveCapacitySnapshot(profile, scenario);
  const effective = resolved ? resolvedLimitsToProfile(profile, resolved) : profile;
  const capacity = interpretCapacityLoad(load, effective, resolved);
  return { scenario, capacity, score: scoreEvaluation(capacity) };
}

function overloadedMetrics(cap: CapacityInterpretation): CapacityLoadMetricId[] {
  return cap.comparisons.filter((c) => c.state === "overloaded").map((c) => c.metricId);
}

function pressuredMetrics(cap: CapacityInterpretation): CapacityLoadMetricId[] {
  return cap.comparisons.filter((c) => c.state === "pressured").map((c) => c.metricId);
}

function findStableByType(
  evals: ScenarioEvaluation[],
  type: ShiftScenarioType,
  excludeId?: string | null,
): ScenarioEvaluation | null {
  return (
    evals.find(
      (e) =>
        e.scenario.scenarioType === type &&
        e.capacity.overallState === "stable" &&
        e.scenario.id !== excludeId,
    ) ?? null
  );
}

function typeToRecommendation(type: ShiftScenarioType): ShiftRequirementType {
  if (type === "strong_shift") return "use_strong_shift";
  if (type === "launch_day") return "use_launch_day";
  if (type === "fbo_prep_day") return "use_fbo_prep_day";
  return "switch_scenario";
}

function buildReductions(
  metrics: CapacityLoadMetricId[],
  split: boolean,
): string[] {
  const keys: string[] = [];
  if (metrics.includes("activeLaunches")) keys.push("prod.shiftReq.reduce.launches");
  if (metrics.includes("refreshTasks")) keys.push("prod.shiftReq.reduce.refresh");
  if (metrics.includes("fboPrepTasks")) keys.push("prod.shiftReq.reduce.fbo");
  if (metrics.includes("visualJobs")) keys.push("prod.shiftReq.reduce.visual");
  if (metrics.includes("cardJobs")) keys.push("prod.shiftReq.reduce.cards");
  if (metrics.includes("packagingLoad")) keys.push("prod.shiftReq.reduce.packaging");
  if (metrics.includes("blockedTasks")) keys.push("prod.shiftReq.reduce.blocked");
  if (split && keys.length >= 2) keys.push("prod.shiftReq.reduce.splitWaves");
  if (!keys.length) keys.push("prod.shiftReq.reduce.general");
  return keys.slice(0, 6);
}

export function deriveShiftRequirement(
  load: ProductionLoadSnapshot,
  currentCapacity: CapacityInterpretation,
): ShiftRequirementRecommendation {
  const shiftState = loadShiftScenariosState();
  const currentScenario = getActiveShiftScenario();
  const currentId = currentScenario?.id ?? shiftState.activeScenarioId;

  const evals = shiftState.scenarios
    .map((s) => evaluateScenario(load, s))
    .filter((e): e is ScenarioEvaluation => e !== null);

  const currentEval =
    evals.find((e) => e.scenario.id === currentId) ??
    evals.find((e) => e.scenario.scenarioType === "normal_shift") ??
    evals[0];

  const currentCap = currentEval?.capacity ?? currentCapacity;
  const currentState = currentCap.overallState;
  const curOver = overloadedMetrics(currentCap);
  const curPressured = pressuredMetrics(currentCap);

  const base = {
    id: newShiftRequirementId(),
    createdAt: Date.now(),
    currentScenarioId: currentId,
    workloadSnapshot: load,
    currentCapacityState: currentState,
    recommendedCapacityState: currentState as CapacityInterpretState,
    unresolvedOverloads: [] as CapacityLoadMetricId[],
    workloadReductions: [] as string[],
    confidenceNoteKey: "prod.shiftReq.confidence.manual",
    reasonVars: {} as Record<string, string>,
  };

  if (!evals.length || !currentCap.hasProfile) {
    return {
      ...base,
      recommendedScenarioId: null,
      recommendationType: "reduce_workload",
      reasonKey: "prod.shiftReq.reason.noScenarios",
      recommendedCapacityState: "unknown",
      workloadReductions: buildReductions(
        ["activeLaunches", "visualJobs", "fboPrepTasks"] as CapacityLoadMetricId[],
        true,
      ),
      confidenceNoteKey: "prod.shiftReq.confidence.noProfile",
    };
  }

  if (currentState === "stable" && curOver.length === 0) {
    return {
      ...base,
      recommendedScenarioId: currentId,
      recommendationType: "keep_current",
      reasonKey: "prod.shiftReq.reason.keep",
      recommendedCapacityState: "stable",
      reasonVars: { scenario: currentEval?.scenario.scenarioType ?? "normal_shift" },
    };
  }

  const sorted = [...evals].sort((a, b) => a.score - b.score);
  const best = sorted[0]!;

  const launchStress =
    curOver.includes("activeLaunches") || curPressured.includes("activeLaunches");
  const fboStress = curOver.includes("fboPrepTasks") || curPressured.includes("fboPrepTasks");
  const visualStress =
    curOver.includes("visualJobs") ||
    curOver.includes("cardJobs") ||
    curPressured.includes("visualJobs") ||
    curPressured.includes("cardJobs");
  const packStress = curOver.includes("packagingLoad") || curPressured.includes("packagingLoad");
  const learning = getProductionShiftLearning();

  if (learning.repeatedMismatch === "fbo_prep_underestimated" && (fboStress || learning.repeatCount >= 2)) {
    const fboDay = findStableByType(evals, "fbo_prep_day", currentId);
    if (fboDay) {
      return {
        ...base,
        recommendedScenarioId: fboDay.scenario.id,
        recommendationType: "use_fbo_prep_day",
        reasonKey: "prod.learn.reason.fboPrep",
        recommendedCapacityState: fboDay.capacity.overallState,
        reasonVars: { count: String(learning.repeatCount) },
      };
    }
  }

  if (
    learning.repeatedMismatch === "packaging_underestimated" &&
    (packStress || learning.repeatCount >= 2)
  ) {
    const launchDay = findStableByType(evals, "launch_day", currentId);
    if (launchDay) {
      return {
        ...base,
        recommendedScenarioId: launchDay.scenario.id,
        recommendationType: "use_launch_day",
        reasonKey: "prod.learn.reason.packaging",
        recommendedCapacityState: launchDay.capacity.overallState,
        reasonVars: { count: String(learning.repeatCount) },
      };
    }
  }

  if (
    learning.repeatedMismatch === "visual_jobs_underestimated" &&
    (visualStress || learning.repeatCount >= 2)
  ) {
    const visualDay = findStableByType(evals, "visual_content_day", currentId);
    if (visualDay) {
      return {
        ...base,
        recommendedScenarioId: visualDay.scenario.id,
        recommendationType: "switch_scenario",
        reasonKey: "prod.learn.reason.visual",
        recommendedCapacityState: visualDay.capacity.overallState,
        reasonVars: { count: String(learning.repeatCount) },
      };
    }
  }

  if (launchStress) {
    const launchDay = findStableByType(evals, "launch_day", currentId);
    if (launchDay) {
      return {
        ...base,
        recommendedScenarioId: launchDay.scenario.id,
        recommendationType: "use_launch_day",
        reasonKey: "prod.shiftReq.reason.launchDay",
        recommendedCapacityState: launchDay.capacity.overallState,
        reasonVars: { current: String(load.activeLaunches) },
      };
    }
  }

  if (fboStress) {
    const fboDay = findStableByType(evals, "fbo_prep_day", currentId);
    if (fboDay) {
      return {
        ...base,
        recommendedScenarioId: fboDay.scenario.id,
        recommendationType: "use_fbo_prep_day",
        reasonKey: "prod.shiftReq.reason.fboPrepDay",
        recommendedCapacityState: fboDay.capacity.overallState,
        reasonVars: { current: String(load.fboPrepTasks) },
      };
    }
  }

  if (visualStress) {
    const visualDay = findStableByType(evals, "visual_content_day", currentId);
    if (visualDay) {
      return {
        ...base,
        recommendedScenarioId: visualDay.scenario.id,
        recommendationType: "switch_scenario",
        reasonKey: "prod.shiftReq.reason.visualDay",
        recommendedCapacityState: visualDay.capacity.overallState,
        reasonVars: {
          visual: String(load.visualJobs),
          cards: String(load.cardJobs),
        },
      };
    }
  }

  if (packStress && !launchStress) {
    const launchDay = findStableByType(evals, "launch_day", currentId);
    if (launchDay) {
      return {
        ...base,
        recommendedScenarioId: launchDay.scenario.id,
        recommendationType: "use_launch_day",
        reasonKey: "prod.shiftReq.reason.packagingLaunchDay",
        recommendedCapacityState: launchDay.capacity.overallState,
        reasonVars: { packaging: String(load.packagingLoad) },
      };
    }
  }

  const strong = findStableByType(evals, "strong_shift", currentId);
  if (
    strong &&
    best.capacity.overallState !== "stable" &&
    strong.score < (currentEval?.score ?? 999)
  ) {
    const onlyStrongStable = evals.filter((e) => e.capacity.overallState === "stable").length === 1;
    if (onlyStrongStable || strong.score <= best.score) {
      return {
        ...base,
        recommendedScenarioId: strong.scenario.id,
        recommendationType: "use_strong_shift",
        reasonKey: "prod.shiftReq.reason.strongShift",
        recommendedCapacityState: "stable",
        reasonVars: {},
      };
    }
  }

  if (
    best.capacity.overallState === "stable" &&
    best.scenario.id !== currentId
  ) {
    const recType = typeToRecommendation(best.scenario.scenarioType);
    return {
      ...base,
      recommendedScenarioId: best.scenario.id,
      recommendationType: recType,
      reasonKey:
        recType === "use_launch_day"
          ? "prod.shiftReq.reason.switchLaunch"
          : recType === "use_fbo_prep_day"
            ? "prod.shiftReq.reason.switchFbo"
            : recType === "use_strong_shift"
              ? "prod.shiftReq.reason.switchStrong"
              : "prod.shiftReq.reason.switchGeneric",
      recommendedCapacityState: "stable",
      reasonVars: {
        from: currentEval?.scenario.scenarioType ?? "—",
        to: best.scenario.scenarioType,
      },
    };
  }

  const bestOver = overloadedMetrics(best.capacity);
  const unresolved = [...new Set([...curOver, ...bestOver])].slice(0, 7);
  const allPressuredOrWorse = evals.every(
    (e) => e.capacity.overallState === "overloaded" || e.capacity.overallState === "pressured",
  );

  if (allPressuredOrWorse || best.score >= 50) {
    const split = unresolved.length >= 3 || load.activeLaunches >= 2;
    return {
      ...base,
      recommendedScenarioId: best.scenario.id !== currentId ? best.scenario.id : null,
      recommendationType: split ? "split_workload" : "reduce_workload",
      reasonKey: split ? "prod.shiftReq.reason.split" : "prod.shiftReq.reason.reduce",
      recommendedCapacityState: best.capacity.overallState,
      unresolvedOverloads: unresolved,
      workloadReductions: buildReductions(unresolved.length ? unresolved : curOver, split),
      reasonVars: { scenarios: String(evals.length) },
    };
  }

  if (currentEval && best.scenario.id !== currentId) {
    return {
      ...base,
      recommendedScenarioId: best.scenario.id,
      recommendationType: typeToRecommendation(best.scenario.scenarioType),
      reasonKey: "prod.shiftReq.reason.switchGeneric",
      recommendedCapacityState: best.capacity.overallState,
      reasonVars: { to: best.scenario.scenarioType },
    };
  }

  return {
    ...base,
    recommendedScenarioId: currentId,
    recommendationType: "keep_current",
    reasonKey: "prod.shiftReq.reason.keepPressured",
    recommendedCapacityState: currentState,
    workloadReductions: buildReductions(curPressured, false),
    reasonVars: {},
  };
}
