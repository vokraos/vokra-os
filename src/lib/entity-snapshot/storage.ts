import { lsDel, lsGet, lsSet, safeJsonParse } from "../storage";
import { ENTITY_SNAPSHOT_EVENT, ENTITY_SNAPSHOT_SCHEMA, type EntitySnapshot } from "./types";

const ENTITY_SNAPSHOT_STORAGE_KEY = "vokra.entitySnapshot.active.v1" as const;

function emitChanged() {
  try {
    window.dispatchEvent(new Event(ENTITY_SNAPSHOT_EVENT));
  } catch {
    /* ignore */
  }
}

export function loadActiveEntitySnapshot(): EntitySnapshot | null {
  const parsed = safeJsonParse<unknown>(lsGet(ENTITY_SNAPSHOT_STORAGE_KEY));
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.schema !== ENTITY_SNAPSHOT_SCHEMA) return null;
  if (typeof o.id !== "string") return null;
  if (!Array.isArray(o.skuEntities)) return null;
  return parsed as EntitySnapshot;
}

export function saveActiveEntitySnapshot(snapshot: EntitySnapshot): void {
  try {
    lsSet(ENTITY_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    emitChanged();
  } catch {
    /* quota */
  }
}

export function clearActiveEntitySnapshot(): void {
  try {
    lsDel(ENTITY_SNAPSHOT_STORAGE_KEY);
    emitChanged();
  } catch {
    /* ignore */
  }
}
