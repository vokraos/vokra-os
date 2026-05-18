import type { RuntimeSmokeTestReport, SmokeRunOptions } from "./types";
import { SMOKE_CHECK_REGISTRY, runRegisteredCheck } from "./registry";
import type { AppLocale } from "../i18n/messages";
import { saveLastRuntimeSmokeReport } from "./storage";

function newSmokeRunId(): string {
  return `smoke-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function confidenceKey(report: Omit<RuntimeSmokeTestReport, "confidenceNoteKey" | "status">): string {
  if (report.failedChecks.length > 0) return "smoke.confidence.failed";
  if (report.skippedChecks.some((c) => c.id === "warmup_os_reports")) return "smoke.confidence.warmupSkipped";
  if (report.skippedChecks.length > 0) return "smoke.confidence.partialSkip";
  return "smoke.confidence.ok";
}

function overallStatus(report: Omit<RuntimeSmokeTestReport, "confidenceNoteKey" | "status">): RuntimeSmokeTestReport["status"] {
  if (report.failedChecks.length > 0) return "failed";
  if (report.skippedChecks.length > 0) return "warning";
  return "passed";
}

/** Run all registered checks; persists last report to localStorage. */
export function runRuntimeSmokeTests(options: SmokeRunOptions = {}): RuntimeSmokeTestReport {
  const locale = (options.locale ?? "ru") as AppLocale;
  const t0 = performance.now();
  const checks = SMOKE_CHECK_REGISTRY.map((def) => runRegisteredCheck(def, locale, options));

  const passedChecks = checks.filter((c) => c.status === "passed");
  const failedChecks = checks.filter((c) => c.status === "failed");
  const warnings = checks.filter((c) => c.status === "warning");
  const skippedChecks = checks.filter((c) => c.status === "skipped");

  const base = {
    id: newSmokeRunId(),
    createdAt: Date.now(),
    passedChecks,
    failedChecks,
    warnings,
    skippedChecks,
    checks,
    durationMs: Math.round(performance.now() - t0),
  };

  const report: RuntimeSmokeTestReport = {
    ...base,
    status: overallStatus(base),
    confidenceNoteKey: confidenceKey(base),
  };

  saveLastRuntimeSmokeReport(report);
  console.info("[RuntimeSmokeTests]", report.status, report.id, `${report.durationMs}ms`);
  return report;
}
