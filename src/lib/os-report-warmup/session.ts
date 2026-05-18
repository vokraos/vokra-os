import { lsGet, lsSet } from "../storage";
import { OS_REPORT_WARMUP_SESSION_KEY, type OsReportWarmupState } from "./types";

export function saveOsReportWarmupState(state: OsReportWarmupState): void {
  try {
    lsSet(OS_REPORT_WARMUP_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function peekOsReportWarmupState(): OsReportWarmupState | null {
  try {
    const raw = lsGet(OS_REPORT_WARMUP_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as OsReportWarmupState;
    return o?.id ? o : null;
  } catch {
    return null;
  }
}

export function getLastWarmupCompletedAt(): number | null {
  const s = peekOsReportWarmupState();
  if (!s || s.status === "warming" || s.status === "idle") return null;
  return s.createdAt;
}
