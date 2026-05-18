import type { MorningFlowMemoryPayload } from "./types";
import { saveMorningFlowProgress, todayDateKey } from "./store";

const SESSION_KEY = "vokra.morningFlow.last.v1" as const;

export function saveMorningFlowSession(payload: MorningFlowMemoryPayload): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
  saveMorningFlowProgress({
    dateKey: payload.progress.dateKey || todayDateKey(),
    flowId: payload.flow.id,
    completedSteps: payload.progress.completedSteps,
    blockedSteps: payload.progress.blockedSteps,
    startSnapshot: payload.progress.startSnapshot,
    savedAt: payload.savedAt,
  });
}

export function peekMorningFlowSession(): MorningFlowMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as MorningFlowMemoryPayload;
    return o?.flow?.id ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromMorningFlowMemoryPayload(payload: MorningFlowMemoryPayload): void {
  saveMorningFlowSession(payload);
}
