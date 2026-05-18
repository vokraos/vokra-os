import { lsGet, lsSet } from "../storage";
import type { SmokeScenarioType, SmokeTestStepId, SmokeTestVerdict } from "./types";

const STATE_KEY = "vokra.realUseTest.state.v1" as const;

export type StoredSmokeTestState = {
  id: string;
  createdAt: number;
  scenarioType: SmokeScenarioType;
  completedSteps: SmokeTestStepId[];
  blockedSteps: SmokeTestStepId[];
  observedFriction: string[];
  usefulScreens: SmokeTestStepId[];
  confusingScreens: SmokeTestStepId[];
  missingData: string[];
  finalVerdict: SmokeTestVerdict;
  savedAt: number;
};

export function loadSmokeTestState(): StoredSmokeTestState | null {
  try {
    const raw = lsGet(STATE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as StoredSmokeTestState;
    if (!o?.id || !o.scenarioType) return null;
    return {
      id: o.id,
      createdAt: o.createdAt,
      scenarioType: o.scenarioType,
      completedSteps: Array.isArray(o.completedSteps) ? o.completedSteps : [],
      blockedSteps: Array.isArray(o.blockedSteps) ? o.blockedSteps : [],
      observedFriction: Array.isArray(o.observedFriction) ? o.observedFriction : [],
      usefulScreens: Array.isArray(o.usefulScreens) ? o.usefulScreens : [],
      confusingScreens: Array.isArray(o.confusingScreens) ? o.confusingScreens : [],
      missingData: Array.isArray(o.missingData) ? o.missingData : [],
      finalVerdict: o.finalVerdict ?? "unset",
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveSmokeTestState(state: StoredSmokeTestState): void {
  lsSet(STATE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
}

export function clearSmokeTestState(): void {
  lsSet(STATE_KEY, "");
}
