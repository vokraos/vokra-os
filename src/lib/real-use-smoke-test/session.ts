import { saveSmokeTestState, type StoredSmokeTestState } from "./store";
import type { RealUseTestMemoryPayload } from "./types";

const SESSION_KEY = "vokra.realUseTest.lastSession.v1" as const;

export function saveRealUseTestSession(payload: RealUseTestMemoryPayload): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
  const state: StoredSmokeTestState = {
    id: payload.test.id,
    createdAt: payload.test.createdAt,
    scenarioType: payload.test.scenarioType,
    completedSteps: payload.test.completedSteps,
    blockedSteps: payload.test.blockedSteps,
    observedFriction: payload.founderNotes.observedFriction,
    usefulScreens: payload.founderNotes.usefulScreens,
    confusingScreens: payload.founderNotes.confusingScreens,
    missingData: payload.founderNotes.missingData,
    finalVerdict: payload.founderNotes.finalVerdict,
    savedAt: Date.now(),
  };
  saveSmokeTestState(state);
}

export function primeSessionsFromRealUseTestMemoryPayload(payload: RealUseTestMemoryPayload): void {
  saveRealUseTestSession(payload);
}
