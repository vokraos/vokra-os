import type { NavId } from "../../types";
import { lsGet, lsSet } from "../storage";
import { DEFAULT_CLEAN_DAY_MODE_STATE, type CleanDayModeState } from "./types";
import { deriveCleanDayHiddenFromBacklog } from "./derive";

export const CLEAN_DAY_MODE_STORAGE_KEY = "vokra.cleanDayMode.v1" as const;
export const CLEAN_DAY_MODE_RESTORE_SESSION_KEY = "vokra.cleanDayMode.restore.v1" as const;
export const CLEAN_DAY_MODE_CHANGED_EVENT = "vokra.cleanDayMode.changed" as const;

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function parseCleanDayModePayload(raw: string): CleanDayModeState | null {
  try {
    const o = JSON.parse(raw) as Partial<CleanDayModeState>;
    if (!o || typeof o !== "object") return null;
    if (typeof o.enabled !== "boolean") return null;
    const hiddenNavIds = Array.isArray(o.hiddenNavIds)
      ? o.hiddenNavIds.filter((x): x is NavId => typeof x === "string" && x.length > 0)
      : [];
    const sourceBacklogItemIds = Array.isArray(o.sourceBacklogItemIds)
      ? o.sourceBacklogItemIds.filter((x): x is string => typeof x === "string")
      : [];
    return {
      enabled: o.enabled,
      createdAt: typeof o.createdAt === "number" && Number.isFinite(o.createdAt) ? o.createdAt : 0,
      hiddenNavIds,
      sourceBacklogItemIds,
      confidenceNote: typeof o.confidenceNote === "string" ? o.confidenceNote : "",
    };
  } catch {
    return null;
  }
}

export function loadCleanDayModeState(): CleanDayModeState {
  const raw = lsGet(CLEAN_DAY_MODE_STORAGE_KEY);
  if (!raw?.trim()) return { ...DEFAULT_CLEAN_DAY_MODE_STATE };
  return parseCleanDayModePayload(raw) ?? { ...DEFAULT_CLEAN_DAY_MODE_STATE };
}

export function saveCleanDayModeState(state: CleanDayModeState) {
  lsSet(CLEAN_DAY_MODE_STORAGE_KEY, JSON.stringify(state));
}

export function notifyCleanDayModeChanged() {
  try {
    window.dispatchEvent(new Event(CLEAN_DAY_MODE_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

/** When enabled, refresh hidden ids from backlog; persists if changed. */
export function syncCleanDayHiddenFromBacklogIfEnabled(): CleanDayModeState {
  const cur = loadCleanDayModeState();
  if (!cur.enabled) return cur;
  const d = deriveCleanDayHiddenFromBacklog();
  if (arraysEqual(cur.hiddenNavIds, d.hiddenNavIds) && arraysEqual(cur.sourceBacklogItemIds, d.sourceBacklogItemIds)) {
    return cur;
  }
  const next: CleanDayModeState = {
    ...cur,
    hiddenNavIds: d.hiddenNavIds,
    sourceBacklogItemIds: d.sourceBacklogItemIds,
  };
  saveCleanDayModeState(next);
  notifyCleanDayModeChanged();
  return next;
}

export function setCleanDayModeEnabled(enabled: boolean): CleanDayModeState {
  const now = Date.now();
  if (!enabled) {
    const next: CleanDayModeState = {
      ...DEFAULT_CLEAN_DAY_MODE_STATE,
      enabled: false,
    };
    saveCleanDayModeState(next);
    notifyCleanDayModeChanged();
    return next;
  }
  const d = deriveCleanDayHiddenFromBacklog();
  const next: CleanDayModeState = {
    enabled: true,
    createdAt: now,
    hiddenNavIds: d.hiddenNavIds,
    sourceBacklogItemIds: d.sourceBacklogItemIds,
    confidenceNote: "",
  };
  saveCleanDayModeState(next);
  notifyCleanDayModeChanged();
  return next;
}

export function getEffectiveCleanDayState(): CleanDayModeState {
  return syncCleanDayHiddenFromBacklogIfEnabled();
}

export function queueCleanDayModeRestore(serialized: string) {
  try {
    sessionStorage.setItem(CLEAN_DAY_MODE_RESTORE_SESSION_KEY, serialized);
  } catch {
    /* ignore */
  }
}

export function consumeCleanDayModeRestore(): string | null {
  try {
    const v = sessionStorage.getItem(CLEAN_DAY_MODE_RESTORE_SESSION_KEY);
    sessionStorage.removeItem(CLEAN_DAY_MODE_RESTORE_SESSION_KEY);
    return v;
  } catch {
    return null;
  }
}

export function applyCleanDayModeRestorePayload(raw: string): boolean {
  const p = parseCleanDayModePayload(raw);
  if (!p) return false;
  saveCleanDayModeState(p);
  notifyCleanDayModeChanged();
  return true;
}
