import type { AppLocale } from "../i18n/messages";
import { buildRealUseSmokeTest } from "./compose";
import { clearSmokeTestState, loadSmokeTestState, saveSmokeTestState, type StoredSmokeTestState } from "./store";
import {
  REAL_USE_TEST_EVENT,
  type RealUseSmokeTest,
  type SmokeScenarioType,
  type SmokeTestStepId,
  type SmokeTestVerdict,
} from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function notifyRealUseTestUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REAL_USE_TEST_EVENT));
}

function persist(state: StoredSmokeTestState): void {
  saveSmokeTestState(state);
  notifyRealUseTestUpdated();
}

function ensureState(scenario?: SmokeScenarioType): StoredSmokeTestState {
  const prev = loadSmokeTestState();
  if (prev && (!scenario || prev.scenarioType === scenario)) return prev;
  const test = buildRealUseSmokeTest(() => "", "en", scenario ?? "daily_operations");
  return {
    id: test.id,
    createdAt: test.createdAt,
    scenarioType: test.scenarioType,
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

export function selectSmokeScenario(scenario: SmokeScenarioType, t: TFn, locale: AppLocale): RealUseSmokeTest {
  clearSmokeTestState();
  const state = ensureState(scenario);
  state.scenarioType = scenario;
  state.completedSteps = [];
  state.blockedSteps = [];
  state.finalVerdict = "unset";
  persist(state);
  return buildRealUseSmokeTest(t, locale, scenario, state.id);
}

export function markSmokeStepDone(stepId: SmokeTestStepId, t: TFn, locale: AppLocale): ReturnType<typeof buildRealUseSmokeTest> {
  const state = ensureState();
  const completed = new Set(state.completedSteps);
  const blocked = new Set(state.blockedSteps);
  completed.add(stepId);
  blocked.delete(stepId);
  persist({ ...state, completedSteps: [...completed], blockedSteps: [...blocked] });
  return buildRealUseSmokeTest(t, locale, undefined, state.id);
}

export function markSmokeStepBlocked(stepId: SmokeTestStepId, t: TFn, locale: AppLocale): ReturnType<typeof buildRealUseSmokeTest> {
  const state = ensureState();
  const completed = new Set(state.completedSteps);
  const blocked = new Set(state.blockedSteps);
  blocked.add(stepId);
  completed.delete(stepId);
  persist({ ...state, completedSteps: [...completed], blockedSteps: [...blocked] });
  return buildRealUseSmokeTest(t, locale, undefined, state.id);
}

export function resetSmokeStep(stepId: SmokeTestStepId, t: TFn, locale: AppLocale): ReturnType<typeof buildRealUseSmokeTest> {
  const state = ensureState();
  const completed = new Set(state.completedSteps);
  const blocked = new Set(state.blockedSteps);
  completed.delete(stepId);
  blocked.delete(stepId);
  persist({ ...state, completedSteps: [...completed], blockedSteps: [...blocked] });
  return buildRealUseSmokeTest(t, locale, undefined, state.id);
}

export function toggleSmokeStepUseful(stepId: SmokeTestStepId, t: TFn, locale: AppLocale): ReturnType<typeof buildRealUseSmokeTest> {
  const state = ensureState();
  const useful = new Set(state.usefulScreens);
  const confusing = new Set(state.confusingScreens);
  if (useful.has(stepId)) useful.delete(stepId);
  else {
    useful.add(stepId);
    confusing.delete(stepId);
  }
  persist({
    ...state,
    usefulScreens: [...useful],
    confusingScreens: [...confusing],
  });
  return buildRealUseSmokeTest(t, locale, undefined, state.id);
}

export function toggleSmokeStepConfusing(stepId: SmokeTestStepId, t: TFn, locale: AppLocale): ReturnType<typeof buildRealUseSmokeTest> {
  const state = ensureState();
  const useful = new Set(state.usefulScreens);
  const confusing = new Set(state.confusingScreens);
  if (confusing.has(stepId)) confusing.delete(stepId);
  else {
    confusing.add(stepId);
    useful.delete(stepId);
  }
  persist({
    ...state,
    usefulScreens: [...useful],
    confusingScreens: [...confusing],
  });
  return buildRealUseSmokeTest(t, locale, undefined, state.id);
}

export function addSmokeFriction(text: string, t: TFn, locale: AppLocale): ReturnType<typeof buildRealUseSmokeTest> {
  const state = ensureState();
  const line = text.replace(/\s+/g, " ").trim();
  if (!line) return buildRealUseSmokeTest(t, locale, undefined, state.id);
  const observedFriction = [...state.observedFriction, line].slice(-12);
  persist({ ...state, observedFriction });
  return buildRealUseSmokeTest(t, locale, undefined, state.id);
}

export function addSmokeMissingData(text: string, t: TFn, locale: AppLocale): ReturnType<typeof buildRealUseSmokeTest> {
  const state = ensureState();
  const line = text.replace(/\s+/g, " ").trim();
  if (!line) return buildRealUseSmokeTest(t, locale, undefined, state.id);
  const missingData = [...state.missingData, line].slice(-12);
  persist({ ...state, missingData });
  return buildRealUseSmokeTest(t, locale, undefined, state.id);
}

export function setSmokeVerdict(verdict: SmokeTestVerdict, t: TFn, locale: AppLocale): ReturnType<typeof buildRealUseSmokeTest> {
  const state = ensureState();
  persist({ ...state, finalVerdict: verdict });
  return buildRealUseSmokeTest(t, locale, undefined, state.id);
}

export function getSmokeTestStateForMemory(): StoredSmokeTestState | null {
  return loadSmokeTestState();
}
