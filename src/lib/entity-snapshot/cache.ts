import type { EntitySnapshot } from "./types";
import type { SnapshotIntelligence } from "./intelligence";

export type SnapshotRevisionKey = string;

export function snapshotRevisionKey(snapshot: EntitySnapshot): SnapshotRevisionKey {
  return `${snapshot.id}:${snapshot.updatedAt}`;
}

let intelCache: { key: SnapshotRevisionKey; value: SnapshotIntelligence } | null = null;

let parseCache: { raw: string | null; snapshot: EntitySnapshot | null } | null = null;

export function invalidateSnapshotDerivationCaches(): void {
  intelCache = null;
  parseCache = null;
}

export function readIntelCache(snapshot: EntitySnapshot): SnapshotIntelligence | null {
  const key = snapshotRevisionKey(snapshot);
  return intelCache?.key === key ? intelCache.value : null;
}

export function writeIntelCache(snapshot: EntitySnapshot, value: SnapshotIntelligence): SnapshotIntelligence {
  intelCache = { key: snapshotRevisionKey(snapshot), value };
  return value;
}

/** undefined = cache miss; null = cached empty snapshot slot. */
export function readParseCache(raw: string | null): EntitySnapshot | null | undefined {
  if (parseCache?.raw === raw) return parseCache.snapshot;
  return undefined;
}

export function writeParseCache(raw: string | null, snapshot: EntitySnapshot | null): EntitySnapshot | null {
  parseCache = { raw, snapshot };
  return snapshot;
}
