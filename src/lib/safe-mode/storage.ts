import { lsDel, lsGet, lsSet } from "../storage";
import {
  ALL_SAFE_MODE_DISABLED_FEATURES,
  SAFE_MODE_STORAGE_KEY,
  type SafeModeDisabledFeature,
  type SafeModeReason,
  type SafeModeState,
} from "./types";

function isDisabledFeature(x: string): x is SafeModeDisabledFeature {
  return (ALL_SAFE_MODE_DISABLED_FEATURES as readonly string[]).includes(x);
}

export function defaultSafeModeState(): SafeModeState {
  return {
    enabled: false,
    reason: "user_manual",
    lastErrorMessage: null,
    lastErrorStack: null,
    lastComponentStack: null,
    disabledFeatures: [],
    createdAt: 0,
  };
}

export function parseSafeModeState(raw: string | null): SafeModeState | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<SafeModeState>;
    if (typeof o !== "object" || o === null) return null;
    const features = Array.isArray(o.disabledFeatures)
      ? o.disabledFeatures.filter((x): x is SafeModeDisabledFeature => typeof x === "string" && isDisabledFeature(x))
      : [];
    return {
      enabled: Boolean(o.enabled),
      reason: (o.reason as SafeModeReason) ?? "user_manual",
      lastErrorMessage: typeof o.lastErrorMessage === "string" ? o.lastErrorMessage : null,
      lastErrorStack: typeof o.lastErrorStack === "string" ? o.lastErrorStack : null,
      lastComponentStack: typeof o.lastComponentStack === "string" ? o.lastComponentStack : null,
      disabledFeatures: features.length ? features : [...ALL_SAFE_MODE_DISABLED_FEATURES],
      createdAt: typeof o.createdAt === "number" ? o.createdAt : Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Cached snapshot so `getSafeModeState()` returns a stable reference until localStorage changes.
 * Required for `useSyncExternalStore` — a fresh object every read causes "Maximum update depth exceeded".
 */
let cachedSafeModeState: SafeModeState | null = null;
let cachedSafeModeRaw: string | null = null;

export function loadSafeModeState(): SafeModeState {
  const raw = lsGet(SAFE_MODE_STORAGE_KEY);
  if (cachedSafeModeState !== null && raw === cachedSafeModeRaw) {
    return cachedSafeModeState;
  }
  cachedSafeModeRaw = raw;
  cachedSafeModeState = parseSafeModeState(raw) ?? defaultSafeModeState();
  return cachedSafeModeState;
}

export function saveSafeModeState(state: SafeModeState): void {
  try {
    lsSet(SAFE_MODE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
  cachedSafeModeRaw = lsGet(SAFE_MODE_STORAGE_KEY);
  cachedSafeModeState = state;
}

export function clearSafeModeStorage(): void {
  try {
    lsDel(SAFE_MODE_STORAGE_KEY);
  } catch {
    /* */
  }
  cachedSafeModeRaw = null;
  cachedSafeModeState = defaultSafeModeState();
}
