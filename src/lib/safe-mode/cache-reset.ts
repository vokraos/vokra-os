/**
 * Session/local cache reset helpers. Never removes entity snapshot or unit economics by default.
 */

import { FOUNDER_BRIEF_LAST_STORAGE_KEY } from "../founder-brief/types";
import { OS_REPORT_WARMUP_SESSION_KEY } from "../os-report-warmup/types";

/** Domain report sessions (sessionStorage keys). */
const REPORT_SESSION_KEYS = [
  "vokra.economicPressure.state",
  "vokra.pricePositioning.state",
  "vokra.adPressure.state",
  "vokra.scalingSafety.state",
  "vokra.fboFbsDecision.state",
  "vokra.productionPressure.state",
  "vokra.corridorStrategy.state",
  "vokra.marketTiming.state",
] as const;

/** Command / tower sessions */
const COMMAND_SESSION_KEYS = [
  "vokra.controlTower.state",
  "vokra.dailyWarRoom.last.v1",
  "vokra.operatorBrief.state",
  "vokra.osHealthAudit.state",
] as const;

/** Broader OS session keys (still not entity / unit economics / project memory). */
const ADDITIONAL_OS_SESSION_KEYS = [
  "vokra.executionFeedback.state",
  "vokra.guidedSetup.state",
  "vokra.launchOperations.state",
  "vokra.morningFlow.last.v1",
  "vokra.eveningClose.lastSession.v1",
  "vokra.heroCommand.state",
  "vokra.integrationReadiness.lastSession.v1",
  "vokra.realUseTest.lastSession.v1",
] as const;

const LOCAL_STORAGE_KEYS_CLEAR_WITH_COMMANDS = [FOUNDER_BRIEF_LAST_STORAGE_KEY] as const;

function removeSessionKeys(keys: readonly string[]): void {
  if (typeof sessionStorage === "undefined") return;
  for (const k of keys) {
    try {
      sessionStorage.removeItem(k);
    } catch {
      /* */
    }
  }
}

function removeLocalKeys(keys: readonly string[]): void {
  if (typeof localStorage === "undefined") return;
  for (const k of keys) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* */
    }
  }
}

export function clearReportCaches(): void {
  removeSessionKeys([...REPORT_SESSION_KEYS]);
}

export function clearWarmupState(): void {
  removeLocalKeys([OS_REPORT_WARMUP_SESSION_KEY]);
}

export function clearCommandCaches(): void {
  removeSessionKeys([...COMMAND_SESSION_KEYS]);
  removeLocalKeys([...LOCAL_STORAGE_KEYS_CLEAR_WITH_COMMANDS]);
}

export type SessionCacheScope = "reports" | "commands" | "warmup" | "full_os_session";

export function clearSessionCaches(scope: SessionCacheScope): void {
  if (scope === "reports" || scope === "full_os_session") {
    clearReportCaches();
  }
  if (scope === "commands" || scope === "full_os_session") {
    clearCommandCaches();
  }
  if (scope === "warmup" || scope === "full_os_session") {
    clearWarmupState();
  }
  if (scope === "full_os_session") {
    removeSessionKeys([...ADDITIONAL_OS_SESSION_KEYS]);
  }
}

/** Nuclear: all sessionStorage + founder brief local key. Does NOT clear entity snapshot or unit economics. */
export function clearAllOsSessionExceptEntityAndEconomics(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const keep = new Set<string>(["vokra.entitySnapshot.active.v1"]);
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && !keep.has(k)) keys.push(k);
    }
    for (const k of keys) sessionStorage.removeItem(k);
  } catch {
    /* */
  }
  removeLocalKeys([...LOCAL_STORAGE_KEYS_CLEAR_WITH_COMMANDS, OS_REPORT_WARMUP_SESSION_KEY]);
}
