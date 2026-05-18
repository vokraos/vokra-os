import { lsGet, lsSet } from "../storage";
import type { RuntimeSmokeTestReport } from "./types";

const LAST_REPORT_KEY = "vokra.os.runtimeSmokeTest.last.v1" as const;

export function saveLastRuntimeSmokeReport(report: RuntimeSmokeTestReport): void {
  try {
    lsSet(LAST_REPORT_KEY, JSON.stringify(report));
  } catch {
    /* quota */
  }
}

export function loadLastRuntimeSmokeReport(): RuntimeSmokeTestReport | null {
  const raw = lsGet(LAST_REPORT_KEY);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as RuntimeSmokeTestReport;
    if (!o?.id || !Array.isArray(o.checks)) return null;
    return o;
  } catch {
    return null;
  }
}
