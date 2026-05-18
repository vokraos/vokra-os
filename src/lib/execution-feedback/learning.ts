import { mergeLearningSignalsIntoStorage } from "../assortment-actions/execution-learning";
import { stableActionId } from "../assortment-actions/hash";
import type { AssortmentExecutionLearningSignal } from "../assortment-actions/types";
import { getActiveEntitySnapshot } from "../entity-snapshot";
import type { ExecutionFeedbackReport } from "./types";
import { pickExecutionFeedbackDigest } from "./digest";

const LATEST_DIGEST_KEY = "vokra.executionFeedback.latestDigest.v1" as const;
const LAST_PROBLEMS_KEY = "vokra.executionFeedback.lastProblems.v1" as const;

export type LatestFeedbackDigest = {
  lineKey: string;
  lineVars: Record<string, string>;
  savedAt: number;
};

export function saveLatestExecutionFeedbackDigest(lineKey: string, lineVars: Record<string, string>): void {
  try {
    localStorage.setItem(
      LATEST_DIGEST_KEY,
      JSON.stringify({ lineKey, lineVars, savedAt: Date.now() } satisfies LatestFeedbackDigest),
    );
  } catch {
    /* quota */
  }
}

export function peekLatestExecutionFeedbackDigest(): LatestFeedbackDigest | null {
  try {
    const raw = localStorage.getItem(LATEST_DIGEST_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as LatestFeedbackDigest;
    return o?.lineKey ? o : null;
  } catch {
    return null;
  }
}

function learningSignal(
  snapshotId: string,
  signalType: "repeated_blocker" | "repeated_deferral" | "high_effort_drag",
  title: string,
  reason: string,
  adjustment: string,
  actionType: string,
  affectedIds: string[],
  recurrence: number,
): AssortmentExecutionLearningSignal {
  return {
    id: stableActionId(["efb", snapshotId, signalType, actionType, title]),
    sourceSnapshotId: snapshotId,
    actionType: "fix_data",
    signalType,
    title,
    reason,
    recurrenceCount: recurrence,
    affectedActionIds: affectedIds,
    recommendedAdjustment: adjustment,
    confidence: Math.min(88, 40 + recurrence * 12),
    createdAt: Date.now(),
  };
}

export function saveLastFeedbackProblems(keys: string[]): void {
  try {
    localStorage.setItem(LAST_PROBLEMS_KEY, JSON.stringify(keys));
  } catch {
    /* quota */
  }
}

export function peekLastFeedbackProblems(): string[] {
  try {
    const raw = localStorage.getItem(LAST_PROBLEMS_KEY);
    if (!raw) return [];
    const o = JSON.parse(raw) as unknown;
    return Array.isArray(o) ? o.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function applyExecutionFeedbackLearning(report: ExecutionFeedbackReport): void {
  const snapshot = getActiveEntitySnapshot();
  if (!snapshot) return;

  const incoming: AssortmentExecutionLearningSignal[] = [];

  if (report.blockedTasks.length >= 2) {
    incoming.push(
      learningSignal(
        snapshot.id,
        "repeated_blocker",
        "efb.learn.blocked.title",
        "efb.learn.blocked.reason",
        "efb.learn.blocked.adjust",
        "operator_feedback",
        report.blockedTasks.map((t) => t.id),
        report.blockedTasks.length,
      ),
    );
  }

  if (report.delayedTasks.length >= 2) {
    incoming.push(
      learningSignal(
        snapshot.id,
        "high_effort_drag",
        "efb.learn.delay.title",
        "efb.learn.delay.reason",
        "efb.learn.delay.adjust",
        "operator_feedback",
        report.delayedTasks.map((t) => t.id),
        report.delayedTasks.length,
      ),
    );
  }

  const deferredLike = report.repeatedTomorrow.length;
  if (deferredLike >= 2) {
    incoming.push(
      learningSignal(
        snapshot.id,
        "repeated_deferral",
        "efb.learn.defer.title",
        "efb.learn.defer.reason",
        "efb.learn.defer.adjust",
        "operator_feedback",
        report.repeatedTomorrow.map((t) => t.id),
        deferredLike,
      ),
    );
  }

  if (incoming.length) mergeLearningSignalsIntoStorage(snapshot.id, incoming);

  saveLastFeedbackProblems(report.operationalProblems);
  const digest = pickExecutionFeedbackDigest(report);
  if (digest) saveLatestExecutionFeedbackDigest(digest.lineKey, digest.lineVars);
}
