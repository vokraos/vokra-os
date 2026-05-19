export const ENTITY_SNAPSHOT_SCHEMA = "vokra.entitySnapshot.v1" as const;

export const ENTITY_SNAPSHOT_EVENT = "vokra-entity-snapshot" as const;

export type EntitySnapshotImportType = "manual_sku_list" | "manual_card_list" | "wb_api_sync";

export type EntitySnapshotWarning = {
  id: string;
  labelKey: string;
  detail?: string;
};

export type SkuEntityCompleteness = "strong" | "weak" | "minimal";

/** One activated SKU row derived from a normalized import row. */
export type SkuEntityRow = {
  id: string;
  skuCode: string;
  article: string;
  marketplace: string;
  stockMode: string;
  corridor: string;
  productFamily: string;
  title: string;
  size: string;
  color: string;
  warehouse: string;
  completeness: SkuEntityCompleteness;
  missingFields: string[];
  /** Set by cleanup workflow — OS hints only, not marketplace truth. */
  heroCandidate?: boolean;
  refreshCandidate?: boolean;
};

/** Card slice when import includes listing fields. */
export type CardEntityRow = {
  id: string;
  skuCode: string;
  cardTitle: string;
  seoCluster: string;
  marketplace: string;
  corridor: string;
  missingHero: boolean;
  missingSeo: boolean;
  missingWarehouse: boolean;
  heroCandidate?: boolean;
  refreshCandidate?: boolean;
};

/** Appended when a new snapshot is produced via Data Cleanup (non-destructive chain). */
export type EnrichmentHistoryEntry = {
  appliedAt: number;
  planId: string;
  appliedActionIds: readonly string[];
  readinessBefore: number;
  readinessAfter: number;
};

/**
 * Active local entity layer — refreshed on “Activate snapshot” from Entity Fusion
 * (normalized manual-import rows). Persisted in localStorage; exportable to Project Memory.
 */
export type EntitySnapshot = {
  schema: typeof ENTITY_SNAPSHOT_SCHEMA;
  id: string;
  /** Ties back to manual import session / fusion flow (e.g. storedAt or opaque id). */
  sourceImportId: string;
  importType: EntitySnapshotImportType;
  createdAt: number;
  updatedAt: number;
  /** Rows included in this activation (same as normalizedRows fed in). */
  rowCountIncluded: number;
  skuEntities: SkuEntityRow[];
  cardEntities: CardEntityRow[];
  corridors: string[];
  productFamilies: string[];
  seoClusters: string[];
  marketplaceCounts: Record<string, number>;
  stockModeCounts: Record<string, number>;
  warnings: EntitySnapshotWarning[];
  /** Snapshot this one was enriched from (cleanup apply). Original import snapshot stays addressable via memory. */
  previousSnapshotId?: string;
  enrichmentHistory?: EnrichmentHistoryEntry[];
};

export type EntitySnapshotMemorySummary = {
  schema: typeof ENTITY_SNAPSHOT_SCHEMA;
  snapshotId: string;
  sourceImportId: string;
  importType: EntitySnapshotImportType;
  savedAt: number;
  skuCount: number;
  cardCount: number;
  corridors: string[];
  productFamilies: string[];
  seoClusters: string[];
  marketplaceCounts: Record<string, number>;
  stockModeCounts: Record<string, number>;
  warnings: EntitySnapshotWarning[];
  /** Digest for Project Memory list / reopen hints */
  intelTopCorridors?: string[];
  intelTopActionKey?: string;
  intelTopActionVars?: Record<string, string>;
  intelMissingDataSlots?: number;
  intelNextStepKey?: string;
};
