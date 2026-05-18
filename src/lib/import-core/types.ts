/**
 * Phase 25 — Local CSV/Excel import architecture (no upload, no backend, no heavy parse).
 */

export const DATA_IMPORT_MEMORY_SCHEMA = "vokra.dataImportMemory.v1" as const;

/** Supported marketplace / production / manual import profiles. */
export type MarketplaceImportKind =
  | "wb_sales_report"
  | "wb_stock_report"
  | "wb_card_report"
  | "wb_ads_report"
  | "ozon_sales_report"
  | "ozon_stock_report"
  | "ozon_ads_report"
  | "production_report"
  | "visual_production_report"
  | "manual_sku_list"
  | "manual_card_list";

/** Canonical normalized field ids — shared across reports. */
export type NormalizedTargetFieldId =
  | "skuCode"
  | "barcode"
  | "nmId"
  | "offerId"
  | "title"
  | "orders"
  | "buyouts"
  | "stock"
  | "impressions"
  | "clicks"
  | "ctr"
  | "price"
  | "warehouse"
  | "revenue"
  | "spend"
  | "sessions"
  | "conversionRate"
  | "corridor"
  | "printJobId"
  | "queueDepth"
  | "shiftHours"
  | "skuName"
  | "marketplace"
  | "article"
  | "size"
  | "color"
  | "stockMode"
  | "productFamily"
  | "cardTitle"
  | "seoCluster";

export type MappingRequirement = "required" | "optional";

export type ColumnValidationStatus = "pending" | "ok" | "warn" | "error";

export type ColumnMappingRule = {
  sourceColumn: string;
  targetField: NormalizedTargetFieldId;
  /** 0–100 — future fuzzy matcher; sample uses heuristics. */
  confidence: number;
  requirement: MappingRequirement;
  /** Human hint for transforms (trim %, locale decimal, etc.) — structure only. */
  transformHint: string;
  validationStatus: ColumnValidationStatus;
};

export type ImportPreviewWarning = {
  id: string;
  labelKey: string;
};

/** Synthetic preview before real file ingestion. */
export type ImportPreview = {
  schema: typeof DATA_IMPORT_MEMORY_SCHEMA;
  importType: MarketplaceImportKind;
  /** Illustrative row count — from sample, not parsed file. */
  rowCount: number;
  detectedColumns: string[];
  mappedColumns: ColumnMappingRule[];
  unmappedColumns: string[];
  requiredMissing: NormalizedTargetFieldId[];
  sampleRows: ReadonlyArray<Readonly<Record<string, string | number>>>;
  warnings: ReadonlyArray<ImportPreviewWarning>;
  /** 0–100 architecture readiness for this import type + mapping completeness (sample). */
  readiness: number;
};

export type DataImportMemoryPayload = {
  schema: typeof DATA_IMPORT_MEMORY_SCHEMA;
  savedAt: number;
  importType: MarketplaceImportKind;
  readiness: number;
  warnings: ReadonlyArray<ImportPreviewWarning>;
  snapshotKind?: "architecture" | "manual_import";
  /** Architecture / synthetic snapshot */
  mappingTemplate?: ColumnMappingRule[];
  sampleNormalizedFields?: Readonly<Record<string, string | number>>;
  /** Manual MVP snapshot */
  mappedFields?: ColumnMappingRule[];
  detectedColumns?: string[];
  normalizedSampleRows?: ReadonlyArray<Readonly<Record<string, string>>>;
  rowCount?: number;
  delimiter?: string;
};

/** Where normalized rows will flow after future pipeline. */
export type ImportFeedTargetId =
  | "sku_intelligence"
  | "card_production"
  | "marketplace_operations"
  | "signal_fabric"
  | "entity_core"
  | "ingestion_readiness";

/** Normalization sinks — documentation for founders + future pipeline. */
export const IMPORT_FEED_TARGETS: readonly { id: ImportFeedTargetId; labelKey: string; ledeKey: string }[] = [
  { id: "sku_intelligence", labelKey: "import.feed.sku_intelligence.label", ledeKey: "import.feed.sku_intelligence.lede" },
  { id: "card_production", labelKey: "import.feed.card_production.label", ledeKey: "import.feed.card_production.lede" },
  {
    id: "marketplace_operations",
    labelKey: "import.feed.marketplace_operations.label",
    ledeKey: "import.feed.marketplace_operations.lede",
  },
  { id: "signal_fabric", labelKey: "import.feed.signal_fabric.label", ledeKey: "import.feed.signal_fabric.lede" },
  { id: "entity_core", labelKey: "import.feed.entity_core.label", ledeKey: "import.feed.entity_core.lede" },
  {
    id: "ingestion_readiness",
    labelKey: "import.feed.ingestion_readiness.label",
    ledeKey: "import.feed.ingestion_readiness.lede",
  },
] as const;
