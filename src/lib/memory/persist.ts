import { lsGet, lsSet } from "../storage";
import { MEMORY_SCHEMA_VERSION, type MemorySnapshot } from "./types";
import { emitMemoryChanged } from "./events";
import { migrateLegacyIfNeeded } from "./migrate";
import { MEMORY_STORAGE_KEY } from "./keys";

const STORAGE_KEY = MEMORY_STORAGE_KEY;

let cache: MemorySnapshot | null = null;
let hydrated = false;

function emptySnapshot(): MemorySnapshot {
  return {
    schemaVersion: MEMORY_SCHEMA_VERSION,
    projects: {},
    skus: {},
    generations: {},
    visualAnalyses: {},
  };
}

/** Internal: read from disk, migrate once, cache. */
export function loadSnapshot(): MemorySnapshot {
  if (cache) return cache;
  if (!hydrated) {
    hydrated = true;
    migrateLegacyIfNeeded();
  }
  const raw = lsGet(STORAGE_KEY);
  if (!raw) {
    cache = emptySnapshot();
    return cache;
  }
  try {
    const p = JSON.parse(raw) as MemorySnapshot;
    if (p?.schemaVersion !== MEMORY_SCHEMA_VERSION || typeof p.projects !== "object") {
      cache = emptySnapshot();
      return cache;
    }
    cache = {
      schemaVersion: MEMORY_SCHEMA_VERSION,
      projects: p.projects ?? {},
      skus: p.skus ?? {},
      generations: p.generations ?? {},
      visualAnalyses: p.visualAnalyses ?? {},
    };
    return cache;
  } catch {
    cache = emptySnapshot();
    return cache;
  }
}

/** Internal: persist + invalidate in-memory cache for other tabs (reload on next read). */
export function saveSnapshot(next: MemorySnapshot) {
  cache = next;
  lsSet(STORAGE_KEY, JSON.stringify(next));
  emitMemoryChanged();
}

export function invalidateMemoryCache() {
  cache = null;
}

export function getMemoryStorageKey() {
  return MEMORY_STORAGE_KEY;
}
