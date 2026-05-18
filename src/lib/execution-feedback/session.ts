import type { ExecutionFeedbackMemoryPayload } from "./types";

const EFB_SESSION_KEY = "vokra.executionFeedback.state" as const;

export function saveExecutionFeedbackSession(payload: ExecutionFeedbackMemoryPayload): void {
  try {
    sessionStorage.setItem(EFB_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekExecutionFeedbackSession(): ExecutionFeedbackMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(EFB_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as ExecutionFeedbackMemoryPayload;
    return o?.report?.id ? o : null;
  } catch {
    return null;
  }
}

export function primeSessionsFromExecutionFeedbackMemoryPayload(payload: ExecutionFeedbackMemoryPayload): void {
  saveExecutionFeedbackSession(payload);
}
