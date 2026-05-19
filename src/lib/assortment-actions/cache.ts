import { invalidateSnapshotDerivationCaches as invalidateEntityCaches, snapshotRevisionKey } from "../entity-snapshot/cache";
import type { EntitySnapshot } from "../entity-snapshot/types";
import { computeAssortmentActions } from "./compute";
import { getAssortmentStatusMap, mergeStatusesIntoActions } from "./storage";
import type { AssortmentAction } from "./types";

let enrichedCache: { key: string; actions: AssortmentAction[] } | null = null;

let mergedCache: { snapshotKey: string; statusKey: string; actions: AssortmentAction[] } | null = null;

function assortmentStatusRevisionKey(snapshotId: string): string {
  const m = getAssortmentStatusMap(snapshotId);
  const entries = Object.entries(m).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return "0";
  return JSON.stringify(entries);
}

export function getAssortmentStatusRevisionKey(snapshotId: string): string {
  return assortmentStatusRevisionKey(snapshotId);
}

export function invalidateAssortmentDerivationCaches(): void {
  enrichedCache = null;
  mergedCache = null;
}

export function invalidateAllSnapshotDerivationCaches(): void {
  invalidateEntityCaches();
  invalidateAssortmentDerivationCaches();
}

export function getCachedDerivedAssortmentActions(snapshot: EntitySnapshot): AssortmentAction[] {
  const key = snapshotRevisionKey(snapshot);
  if (enrichedCache?.key === key) return enrichedCache.actions;
  const actions = computeAssortmentActions(snapshot);
  enrichedCache = { key, actions };
  return actions;
}

export function getCachedMergedAssortmentActions(snapshot: EntitySnapshot): AssortmentAction[] {
  const snapshotKey = snapshotRevisionKey(snapshot);
  const statusKey = assortmentStatusRevisionKey(snapshot.id);
  if (mergedCache?.snapshotKey === snapshotKey && mergedCache.statusKey === statusKey) {
    return mergedCache.actions;
  }
  const merged = mergeStatusesIntoActions(getCachedDerivedAssortmentActions(snapshot), snapshot.id);
  mergedCache = { snapshotKey, statusKey, actions: merged };
  return merged;
}

/** Cached entry point — same signature as prior deriveAssortmentActions. */
export function deriveAssortmentActions(snapshot: EntitySnapshot): AssortmentAction[] {
  return getCachedDerivedAssortmentActions(snapshot);
}
