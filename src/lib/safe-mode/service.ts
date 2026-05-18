import { saveSafeModeState, loadSafeModeState, clearSafeModeStorage, defaultSafeModeState } from "./storage";
import {
  ALL_SAFE_MODE_DISABLED_FEATURES,
  SAFE_MODE_EVENT,
  type SafeModeDisabledFeature,
  type SafeModeReason,
  type SafeModeState,
} from "./types";

export function notifySafeModeChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SAFE_MODE_EVENT));
}

export function getSafeModeState(): SafeModeState {
  return loadSafeModeState();
}

export function isSafeModeEnabled(): boolean {
  return loadSafeModeState().enabled;
}

export function isSafeModeFeatureDisabled(feature: SafeModeDisabledFeature): boolean {
  const s = loadSafeModeState();
  if (!s.enabled) return false;
  return s.disabledFeatures.includes(feature);
}

export function enterSafeModeFromError(
  error: Error,
  errorInfo?: { componentStack?: string | null },
  reason: SafeModeReason = "uncaught_render",
): SafeModeState {
  const state: SafeModeState = {
    enabled: true,
    reason,
    lastErrorMessage: error.message || String(error),
    lastErrorStack: error.stack ?? null,
    lastComponentStack: errorInfo?.componentStack ?? null,
    disabledFeatures: [...ALL_SAFE_MODE_DISABLED_FEATURES],
    createdAt: Date.now(),
  };
  saveSafeModeState(state);
  notifySafeModeChanged();
  return state;
}

export function enterSafeModeManual(disabled?: SafeModeDisabledFeature[]): SafeModeState {
  const state: SafeModeState = {
    enabled: true,
    reason: "user_manual",
    lastErrorMessage: null,
    lastErrorStack: null,
    lastComponentStack: null,
    disabledFeatures: disabled?.length ? [...disabled] : [...ALL_SAFE_MODE_DISABLED_FEATURES],
    createdAt: Date.now(),
  };
  saveSafeModeState(state);
  notifySafeModeChanged();
  return state;
}

export function exitSafeMode(keepErrorAudit = true): void {
  const prev = loadSafeModeState();
  const next: SafeModeState = {
    ...defaultSafeModeState(),
    lastErrorMessage: keepErrorAudit ? prev.lastErrorMessage : null,
    lastErrorStack: keepErrorAudit ? prev.lastErrorStack : null,
    lastComponentStack: keepErrorAudit ? prev.lastComponentStack : null,
    createdAt: keepErrorAudit ? prev.createdAt : 0,
  };
  saveSafeModeState(next);
  notifySafeModeChanged();
}

export function exitSafeModeFully(): void {
  clearSafeModeStorage();
  notifySafeModeChanged();
}

export function subscribeSafeMode(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const fn = () => listener();
  window.addEventListener(SAFE_MODE_EVENT, fn);
  return () => window.removeEventListener(SAFE_MODE_EVENT, fn);
}

export function isCommandCompositionRestricted(): boolean {
  return isSafeModeEnabled() && isSafeModeFeatureDisabled("command_composition");
}

/** Update disabled feature flags while staying in safe mode (e.g. re-enable warmup only). */
export function patchSafeModeFeatures(disabled: SafeModeDisabledFeature[]): void {
  const prev = loadSafeModeState();
  if (!prev.enabled) return;
  const next: SafeModeState = {
    ...prev,
    disabledFeatures: [...disabled],
  };
  saveSafeModeState(next);
  notifySafeModeChanged();
}
