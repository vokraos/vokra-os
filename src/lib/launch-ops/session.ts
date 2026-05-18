import { saveLaunchReview } from "./review/storage";
import type { LaunchReviewMemoryPayload } from "./review/types";
import { LAUNCH_OPS_MEMORY_SCHEMA, type LaunchOpsMemoryPayload } from "./types";

const LAUNCH_OPS_SESSION_KEY = "vokra.launchOperations.state" as const;

export function saveLaunchOpsSession(payload: LaunchOpsMemoryPayload): void {
  try {
    sessionStorage.setItem(LAUNCH_OPS_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function peekLaunchOpsSession(): LaunchOpsMemoryPayload | null {
  try {
    const raw = sessionStorage.getItem(LAUNCH_OPS_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as LaunchOpsMemoryPayload;
    return o?.plan ? o : null;
  } catch {
    return null;
  }
}

export function consumeLaunchOpsSession(): LaunchOpsMemoryPayload | null {
  const o = peekLaunchOpsSession();
  if (!o) return null;
  sessionStorage.removeItem(LAUNCH_OPS_SESSION_KEY);
  return o;
}

export function primeSessionsFromLaunchOpsMemoryPayload(payload: LaunchOpsMemoryPayload): void {
  if (payload.review) saveLaunchReview(payload.review);
  saveLaunchOpsSession(payload);
}

export function primeSessionsFromLaunchReviewMemoryPayload(payload: LaunchReviewMemoryPayload): void {
  saveLaunchReview(payload.review);
  if (payload.plan) {
    saveLaunchOpsSession({
      schema: LAUNCH_OPS_MEMORY_SCHEMA,
      savedAt: payload.savedAt,
      plan: payload.plan,
      review: payload.review,
    });
  }
}
