import type { AppLocale } from "../i18n/messages";
import { SCENARIO_STEP_ORDER, stepsForScenario } from "./scenarios";
import { buildSmokeTestSimplification, deriveRecommendedFromVerdict } from "./simplify";
import { loadSmokeTestState, type StoredSmokeTestState } from "./store";
import type {
  RealUseSmokeTest,
  SmokeScenarioType,
  SmokeTestStep,
  SmokeTestStepId,
  SmokeTestVerdict,
} from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function newTestId(): string {
  return `rtest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultState(scenario: SmokeScenarioType): StoredSmokeTestState {
  return {
    id: newTestId(),
    createdAt: Date.now(),
    scenarioType: scenario,
    completedSteps: [],
    blockedSteps: [],
    observedFriction: [],
    usefulScreens: [],
    confusingScreens: [],
    missingData: [],
    finalVerdict: "unset",
    savedAt: Date.now(),
  };
}

function stepStatus(
  id: SmokeTestStepId,
  completed: Set<SmokeTestStepId>,
  blocked: Set<SmokeTestStepId>,
): SmokeTestStep["status"] {
  if (completed.has(id)) return "done";
  if (blocked.has(id)) return "blocked";
  return "pending";
}

function firstPending(scenario: SmokeScenarioType, completed: Set<SmokeTestStepId>, blocked: Set<SmokeTestStepId>): SmokeTestStepId {
  for (const id of SCENARIO_STEP_ORDER[scenario]) {
    if (!completed.has(id) && !blocked.has(id)) return id;
  }
  const order = SCENARIO_STEP_ORDER[scenario];
  return order[order.length - 1] ?? "war_room";
}

function confidenceKey(
  blocked: number,
  confusing: number,
  verdict: SmokeTestVerdict,
  complete: boolean,
): string {
  if (!complete) return "rtest.confidence.inProgress";
  if (verdict === "blocked" || blocked >= 3) return "rtest.confidence.blocked";
  if (verdict === "confusing" || confusing >= 3) return "rtest.confidence.confusing";
  if (verdict === "partial") return "rtest.confidence.partial";
  if (verdict === "works") return "rtest.confidence.works";
  return "rtest.confidence.needsVerdict";
}

export function buildRealUseSmokeTest(
  t: TFn,
  _locale: AppLocale = "en",
  scenarioOverride?: SmokeScenarioType,
  existingId?: string,
): RealUseSmokeTest {
  const stored = loadSmokeTestState();
  const scenario = scenarioOverride ?? stored?.scenarioType ?? "daily_operations";

  const state: StoredSmokeTestState =
    stored && stored.scenarioType === scenario && (!existingId || stored.id === existingId)
      ? stored
      : scenarioOverride
        ? { ...defaultState(scenario), id: existingId ?? newTestId() }
        : stored ?? defaultState(scenario);

  const completed = new Set(state.completedSteps);
  const blocked = new Set(state.blockedSteps);
  const defs = stepsForScenario(scenario);

  const steps: SmokeTestStep[] = defs.map((d) => ({
    id: d.id,
    navId: d.navId,
    titleKey: d.titleKey,
    whyKey: d.whyKey,
    status: stepStatus(d.id, completed, blocked),
  }));

  const order = SCENARIO_STEP_ORDER[scenario];
  const isComplete = order.every((id) => completed.has(id) || blocked.has(id));
  const currentStep = firstPending(scenario, completed, blocked);

  const simplification = isComplete ? buildSmokeTestSimplification(state, t) : null;
  const recommendedSimplifications =
    isComplete && state.finalVerdict !== "unset" && simplification
      ? deriveRecommendedFromVerdict(state.finalVerdict, simplification, t)
      : simplification?.recommendedSimplifications ?? [];

  return {
    id: state.id,
    createdAt: state.createdAt,
    scenarioType: scenario,
    currentStep,
    completedSteps: [...completed],
    blockedSteps: [...blocked],
    observedFriction: state.observedFriction,
    usefulScreens: state.usefulScreens,
    confusingScreens: state.confusingScreens,
    missingData: state.missingData,
    finalVerdict: state.finalVerdict,
    recommendedSimplifications,
    confidenceNote: confidenceKey(
      blocked.size,
      state.confusingScreens.length,
      state.finalVerdict,
      isComplete,
    ),
    steps,
    simplification,
    isComplete,
  };
}
