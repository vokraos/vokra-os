import type { AppLocale } from "../i18n/messages";
import { warmupOsReports } from "../os-report-warmup";
import { isSafeModeFeatureDisabled } from "../safe-mode";
import { smokeT } from "./report-builders";
import { assertWarmupLatchClear } from "./recursion-guard";

export function runSmokeWarmup(locale: AppLocale, force: boolean): void {
  if (isSafeModeFeatureDisabled("report_warmup")) {
    throw new Error("skipped: report_warmup disabled (safe mode)");
  }
  const state = warmupOsReports({ force, locale, t: smokeT, reason: "manual" });
  assertWarmupLatchClear();
  if (state.status === "failed") {
    throw new Error(`warmup failed: ${state.failedReports.join(", ") || "unknown"}`);
  }
}
