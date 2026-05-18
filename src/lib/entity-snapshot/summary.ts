import type { EntitySnapshot, EntitySnapshotMemorySummary } from "./types";
import { ENTITY_SNAPSHOT_SCHEMA } from "./types";
import type { SnapshotIntelligence } from "./intelligence";

export function parseEntitySnapshotPayload(raw: unknown): EntitySnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schema !== ENTITY_SNAPSHOT_SCHEMA) return null;
  if (typeof o.id !== "string") return null;
  if (typeof o.sourceImportId !== "string") return null;
  if (!Array.isArray(o.skuEntities)) return null;
  if (!Array.isArray(o.cardEntities)) return null;
  if (!Array.isArray(o.corridors)) return null;
  if (typeof o.rowCountIncluded !== "number") return null;
  return o as EntitySnapshot;
}

export function buildEntitySnapshotMemorySummary(s: EntitySnapshot, intel?: SnapshotIntelligence | null): EntitySnapshotMemorySummary {
  const top = intel?.actionQueue[0];
  const topCorridors = intel?.corridorSummary.slice(0, 3).map((c) => c.corridor) ?? s.corridors.slice(0, 3);
  return {
    schema: ENTITY_SNAPSHOT_SCHEMA,
    snapshotId: s.id,
    sourceImportId: s.sourceImportId,
    importType: s.importType,
    savedAt: Date.now(),
    skuCount: s.skuEntities.length,
    cardCount: s.cardEntities.length,
    corridors: s.corridors,
    productFamilies: s.productFamilies,
    seoClusters: s.seoClusters,
    marketplaceCounts: { ...s.marketplaceCounts },
    stockModeCounts: { ...s.stockModeCounts },
    warnings: [...s.warnings],
    intelTopCorridors: topCorridors,
    intelTopActionKey: top?.titleKey,
    intelTopActionVars: top?.vars,
    intelMissingDataSlots: intel?.missingFieldSummary.totalSlots,
    intelNextStepKey: intel?.suggestedNextStepKey,
  };
}
