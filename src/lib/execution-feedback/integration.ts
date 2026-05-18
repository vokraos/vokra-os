import type { OsHealthAuditReport } from "../os-health-audit/types";
import type { StrategicControlTowerSnapshot } from "../strategic-control-tower/types";
import type { MarketplaceLaunchPlan } from "../launch-ops/types";
import { pickExecutionFeedbackDigest } from "./digest";
import { buildExecutionFeedbackReport } from "./compose";
import { peekLastFeedbackProblems } from "./learning";
import type { AppLocale } from "../i18n/messages";
type TFn = (key: string, vars?: Record<string, string>) => string;

export type ControlTowerFeedbackSlice = {
  executionFeedbackLineKey: string | null;
  executionFeedbackLineVars: Record<string, string>;
};

export function buildControlTowerFeedbackSlice(t: TFn, locale: AppLocale): ControlTowerFeedbackSlice {
  const report = buildExecutionFeedbackReport(t, locale);
  const digest = pickExecutionFeedbackDigest(report);
  if (!digest) return { executionFeedbackLineKey: null, executionFeedbackLineVars: {} };
  return {
    executionFeedbackLineKey: digest.lineKey,
    executionFeedbackLineVars: digest.lineVars,
  };
}

export function enrichControlTowerWithExecutionFeedback(
  tower: StrategicControlTowerSnapshot,
  t: TFn,
  locale: AppLocale,
): StrategicControlTowerSnapshot & ControlTowerFeedbackSlice {
  const slice = buildControlTowerFeedbackSlice(t, locale);
  const warningKeys = [...tower.warningKeys];
  const report = buildExecutionFeedbackReport(t, locale);
  for (const p of report.operationalProblems.slice(0, 2)) {
    if (!warningKeys.includes(p)) warningKeys.push(p);
  }
  return { ...tower, ...slice, warningKeys: [...new Set(warningKeys)].slice(0, 8) };
}

export function enrichOsHealthAuditWithStoredFeedback(report: OsHealthAuditReport): OsHealthAuditReport {
  const problems = peekLastFeedbackProblems();
  if (!problems.length) return report;
  const reliabilityWarningKeys = [...report.reliabilityWarningKeys];
  for (const p of problems.slice(0, 3)) {
    if (!reliabilityWarningKeys.includes(p)) reliabilityWarningKeys.push(p);
  }
  return { ...report, reliabilityWarningKeys: reliabilityWarningKeys.slice(0, 8) };
}

export function enrichOsHealthAuditWithExecutionFeedback(
  report: OsHealthAuditReport,
  t: TFn,
  locale: AppLocale,
): OsHealthAuditReport {
  const stored = enrichOsHealthAuditWithStoredFeedback(report);
  const fb = buildExecutionFeedbackReport(t, locale);
  if (!fb.operationalProblems.length) return stored;
  const reliabilityWarningKeys = [...stored.reliabilityWarningKeys];
  for (const p of fb.operationalProblems.slice(0, 3)) {
    if (!reliabilityWarningKeys.includes(p)) reliabilityWarningKeys.push(p);
  }
  const recommendedFixKeys = [...stored.recommendedFixKeys];
  for (const f of fb.recommendedFixes.slice(0, 2)) {
    if (!recommendedFixKeys.includes(f)) recommendedFixKeys.push(f);
  }
  return {
    ...stored,
    reliabilityWarningKeys: reliabilityWarningKeys.slice(0, 8),
    recommendedFixKeys: recommendedFixKeys.slice(0, 8),
  };
}

export function getGuidedSetupFeedbackHintKey(t: TFn, locale: AppLocale): string | null {
  const report = buildExecutionFeedbackReport(t, locale);
  if (report.unclearTasks.length >= 1) return "efb.hint.unclearInstructions";
  if (report.blockedTasks.length >= 2) return "efb.hint.blockedCadence";
  if (report.delayedTasks.length >= 2) return "efb.hint.timingOverload";
  return null;
}

export function enrichLaunchPlanWithExecutionFeedback(
  plan: MarketplaceLaunchPlan,
  t: TFn,
  locale: AppLocale,
): MarketplaceLaunchPlan {
  const report = buildExecutionFeedbackReport(t, locale);
  if (!report.delayedTasks.some((x) => x.source === "launch") && !report.blockedTasks.some((x) => x.source === "launch")) {
    return plan;
  }
  const banner = report.operationalProblems[0] ?? "efb.problem.launchDelays";
  if (plan.operationalWarnings.includes(banner)) return plan;
  return {
    ...plan,
    operationalWarnings: [...plan.operationalWarnings, banner].slice(0, 12),
  };
}

export function formatControlTowerExecutionFeedbackLine(
  slice: ControlTowerFeedbackSlice,
  t: TFn,
): string | null {
  if (!slice.executionFeedbackLineKey) return null;
  return t("efb.controlTower.line", {
    detail: t(slice.executionFeedbackLineKey, slice.executionFeedbackLineVars),
  });
}
