/**
 * Phase 26 — Entity fusion architecture (imported rows → strategic entities). No live API, no sync, no backend.
 */

export const ENTITY_FUSION_MEMORY_SCHEMA = "vokra.entityFusionMemory.v1" as const;

/** Match quality for future merge decisions. */
export type FusionConfidenceLevel = "exact" | "high" | "medium" | "weak" | "unresolved";

export type ImportedRowSource = "wb" | "ozon" | "neutral_stub";

/** Lightweight stand-in for a normalized import row before persistence. */
export type ImportedRowSummary = {
  rowKey: string;
  source: ImportedRowSource;
  articleOrOffer: string;
  corridorHint?: string;
};

export type StrategicEntityKind =
  | "sku_entity"
  | "card_production_plan"
  | "visual_asset"
  | "launch_wave"
  | "collection"
  | "marketplace_operations";

export type MatchedEntityRef = {
  id: string;
  kind: StrategicEntityKind;
  /** Short label for UI — not a live join. */
  label: string;
  confidence: FusionConfidenceLevel;
  /** 0–1 internal score — averaged for preview. */
  score01: number;
  matchedFromRowKeys: readonly string[];
};

export type FusionConflictKind =
  | "duplicate_sku"
  | "conflicting_corridor"
  | "missing_mapping"
  | "orphan_card"
  | "unresolved_hero"
  | "multiple_visual_ownership"
  | "stale_operational_state";

export type FusionConflict = {
  id: string;
  kind: FusionConflictKind;
  severity: "low" | "mid" | "high";
  labelKey: string;
  relatedRowKeys: readonly string[];
};

export type AffectedSystemRef = {
  id: string;
  labelKey: string;
};

export type FusionStrategicImpact = {
  skusUpdated: number;
  heroCorridorsAffected: number;
  launchWavesImpacted: number;
  visualAssetsLinked: number;
  unresolvedConflicts: number;
};

/** Full synthetic fusion preview — structure for memory + UI. */
export type FusionPreviewEntity = {
  schema: typeof ENTITY_FUSION_MEMORY_SCHEMA;
  derivedAt: number;
  importedRows: number;
  importedRowsSample: ReadonlyArray<ImportedRowSummary>;
  matchedEntities: ReadonlyArray<MatchedEntityRef>;
  unresolvedRows: number;
  unresolvedSamples: ReadonlyArray<ImportedRowSummary>;
  conflictCount: number;
  conflicts: ReadonlyArray<FusionConflict>;
  confidenceAverage: number;
  fusionReadiness: number;
  affectedSystems: ReadonlyArray<AffectedSystemRef>;
  strategicImpact: FusionStrategicImpact;
  /** Distinct corridors touched by fusion sample. */
  affectedCorridors: readonly string[];
  /** Launch wave ids / labels in scope. */
  affectedWaves: readonly { id: string; corridor: string }[];
  /** SKU families / codes touched by matches. */
  affectedSkus: readonly string[];
};

export type EntityFusionMemoryPayload = FusionPreviewEntity;

export type MergeIntentKind = "attach_import_to_sku" | "link_offer_to_plan" | "bind_hero_visual" | "patch_wave_readiness";

/** Declarative merge step — execution deferred. */
export type MergeIntent = {
  id: string;
  kind: MergeIntentKind;
  labelKey: string;
  sourceRowKey: string;
  targetEntityId: string;
  proposedConfidence: FusionConfidenceLevel;
};
