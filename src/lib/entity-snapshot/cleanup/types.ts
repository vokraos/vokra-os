import type { EntitySnapshot, EntitySnapshotWarning } from "../types";

export type CleanupConfidence = "high" | "medium" | "low";

export type MissingFieldGroup = {
  id: string;
  field: string;
  labelKey: string;
  affectedSkuCount: number;
  affectedCardCount: number;
  sampleCodes: string[];
};

export type SuggestedValueGroup = {
  id: string;
  proposedValue: string;
  confidence: CleanupConfidence;
  reasonKey: string;
  skuCodes: string[];
  previewTitles: string[];
};

export type CleanupBatchActionKind =
  | "assign_corridor"
  | "assign_product_family"
  | "assign_seo_cluster"
  | "assign_marketplace"
  | "assign_stock_mode"
  | "mark_hero_candidate"
  | "mark_refresh_candidate"
  | "split_mixed_group"
  | "ignore_defer";

export type CleanupBatchActionStatus = "pending" | "applied" | "deferred" | "ignored";

export type CleanupBatchAction = {
  id: string;
  kind: CleanupBatchActionKind;
  titleKey: string;
  reasonKey: string;
  affectedCount: number;
  confidence: CleanupConfidence;
  previewExamples: string[];
  status: CleanupBatchActionStatus;
  assignValue?: string;
  targetSkuIds?: string[];
  targetCardIds?: string[];
  vars?: Record<string, string>;
};

export type EntityCleanupPlan = {
  id: string;
  sourceSnapshotId: string;
  createdAt: number;
  missingFieldGroups: MissingFieldGroup[];
  suggestedCorridors: SuggestedValueGroup[];
  suggestedProductFamilies: SuggestedValueGroup[];
  suggestedSeoClusters: SuggestedValueGroup[];
  batchActions: CleanupBatchAction[];
  affectedSkuCount: number;
  affectedCardCount: number;
  readinessBefore: number;
  readinessAfterEstimate: number;
  warnings: EntitySnapshotWarning[];
};

export const DATA_CLEANUP_MEMORY_SCHEMA = "vokra.dataCleanupMemory.v1" as const;

export type DataCleanupMemoryPayload = {
  schema: typeof DATA_CLEANUP_MEMORY_SCHEMA;
  plan: EntityCleanupPlan;
  appliedActionIds: string[];
  enrichedSnapshot: EntitySnapshot;
  readinessAfter: number;
};
