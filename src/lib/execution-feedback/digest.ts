import { buildExecutionFeedbackReport } from "./compose";
import { loadExecutionFeedbackOverlay } from "./overlay";
import type { AppLocale } from "../i18n/messages";
import type { ExecutionFeedbackDigest, ExecutionFeedbackReport } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function pickExecutionFeedbackDigest(report: ExecutionFeedbackReport): ExecutionFeedbackDigest | null {
  const delayedLaunch = report.delayedTasks.filter((t) => t.source === "launch").length;
  const unclearVisual = report.unclearTasks.filter((t) => t.source === "visual").length;

  if (delayedLaunch >= 1) {
    return { lineKey: "efb.daily.launchDelays", lineVars: { n: String(delayedLaunch) } };
  }
  if (unclearVisual >= 1) {
    return { lineKey: "efb.daily.unclearVisual", lineVars: { n: String(unclearVisual) } };
  }
  if (report.blockedTasks.length >= 2) {
    return { lineKey: "efb.daily.repeatedBlocked", lineVars: { n: String(report.blockedTasks.length) } };
  }
  if (report.delayedTasks.length >= 2) {
    return { lineKey: "efb.daily.timingOverload", lineVars: { n: String(report.delayedTasks.length) } };
  }
  if (report.repeatedTomorrow.length >= 2) {
    return { lineKey: "efb.daily.repeatTomorrow", lineVars: { n: String(report.repeatedTomorrow.length) } };
  }

  const hasSignal =
    report.operationalProblems.length > 0 ||
    report.unclearTasks.length > 0 ||
    report.delayedTasks.length > 0 ||
    report.blockedTasks.length > 0;

  if (!hasSignal) return null;
  return { lineKey: "efb.daily.generic", lineVars: {} };
}

export function peekExecutionFeedbackDigest(t: TFn, locale: AppLocale): ExecutionFeedbackDigest | null {
  const overlay = loadExecutionFeedbackOverlay();
  if (!Object.keys(overlay.byTaskKey).length && !overlay.operatorNotes.trim()) return null;
  const report = buildExecutionFeedbackReport(t, locale);
  return pickExecutionFeedbackDigest(report);
}

export function formatExecutionFeedbackDailyLine(t: TFn, locale: AppLocale): string | null {
  const digest = peekExecutionFeedbackDigest(t, locale);
  if (!digest) return null;
  return t(digest.lineKey, digest.lineVars);
}
