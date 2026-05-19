import { lsDel, lsGet, lsSet, safeJsonParse } from "../storage";
import { invalidateAllSnapshotDerivationCaches } from "../assortment-actions/cache";
import { invalidateDailyConsoleLineCache } from "../daily-operating/consoleContext";
import { readParseCache, writeParseCache } from "./cache";
import { ENTITY_SNAPSHOT_EVENT, ENTITY_SNAPSHOT_SCHEMA, type EntitySnapshot } from "./types";

const ENTITY_SNAPSHOT_STORAGE_KEY = "vokra.entitySnapshot.active.v1" as const;

function emitChanged() {
  try {
    window.dispatchEvent(new Event(ENTITY_SNAPSHOT_EVENT));
  } catch {
    /* ignore */
  }
}

function parseSnapshotRaw(raw: string | null): EntitySnapshot | null {
  const parsed = safeJsonParse<unknown>(raw);
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.schema !== ENTITY_SNAPSHOT_SCHEMA) return null;
  if (typeof o.id !== "string") return null;
  if (!Array.isArray(o.skuEntities)) return null;
  return parsed as EntitySnapshot;
}

export function loadActiveEntitySnapshot(): EntitySnapshot | null {
  const raw = lsGet(ENTITY_SNAPSHOT_STORAGE_KEY) ?? null;
  const cached = readParseCache(raw);
  if (cached !== undefined) return cached;
  const snapshot = parseSnapshotRaw(raw);
  return writeParseCache(raw, snapshot);
}

export function saveActiveEntitySnapshot(snapshot: EntitySnapshot): void {
  try {
    const raw = JSON.stringify(snapshot);
    lsSet(ENTITY_SNAPSHOT_STORAGE_KEY, raw);
    invalidateAllSnapshotDerivationCaches();
    invalidateDailyConsoleLineCache();
    writeParseCache(raw, snapshot);
    emitChanged();
  } catch {
    /* quota */
  }
}

export function clearActiveEntitySnapshot(): void {
  try {
    lsDel(ENTITY_SNAPSHOT_STORAGE_KEY);
    invalidateAllSnapshotDerivationCaches();
    invalidateDailyConsoleLineCache();
    writeParseCache(null, null);
    emitChanged();
  } catch {
    /* ignore */
  }
}
