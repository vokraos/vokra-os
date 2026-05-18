import type { MarketplaceImportKind, NormalizedTargetFieldId } from "./types";

export type ImportSchemaDefinition = {
  /** i18n key for report title */
  labelKey: string;
  /** Fields we expect to resolve from typical exports — documentation + validation. */
  expectedTargets: readonly NormalizedTargetFieldId[];
  /** Subset of expectedTargets that must be mapped for “green” readiness in samples. */
  requiredTargets: readonly NormalizedTargetFieldId[];
};

export const IMPORT_SCHEMAS: Readonly<Record<MarketplaceImportKind, ImportSchemaDefinition>> = {
  wb_sales_report: {
    labelKey: "import.type.wb_sales_report",
    expectedTargets: ["skuCode", "nmId", "barcode", "orders", "buyouts", "revenue", "warehouse", "title"],
    requiredTargets: ["skuCode", "orders"],
  },
  wb_stock_report: {
    labelKey: "import.type.wb_stock_report",
    expectedTargets: ["skuCode", "nmId", "barcode", "stock", "warehouse", "title"],
    requiredTargets: ["skuCode", "stock"],
  },
  wb_card_report: {
    labelKey: "import.type.wb_card_report",
    expectedTargets: ["skuCode", "nmId", "barcode", "title", "price", "warehouse"],
    requiredTargets: ["skuCode", "title"],
  },
  wb_ads_report: {
    labelKey: "import.type.wb_ads_report",
    expectedTargets: ["skuCode", "nmId", "impressions", "clicks", "ctr", "spend", "orders"],
    requiredTargets: ["skuCode", "impressions", "clicks"],
  },
  ozon_sales_report: {
    labelKey: "import.type.ozon_sales_report",
    expectedTargets: ["offerId", "skuCode", "barcode", "orders", "revenue", "buyouts", "title"],
    requiredTargets: ["offerId", "orders"],
  },
  ozon_stock_report: {
    labelKey: "import.type.ozon_stock_report",
    expectedTargets: ["offerId", "skuCode", "stock", "warehouse", "barcode"],
    requiredTargets: ["offerId", "stock"],
  },
  ozon_ads_report: {
    labelKey: "import.type.ozon_ads_report",
    expectedTargets: ["offerId", "skuCode", "impressions", "clicks", "ctr", "spend", "orders"],
    requiredTargets: ["offerId", "impressions"],
  },
  production_report: {
    labelKey: "import.type.production_report",
    expectedTargets: ["printJobId", "skuCode", "queueDepth", "shiftHours", "stock", "corridor"],
    requiredTargets: ["skuCode", "queueDepth"],
  },
  visual_production_report: {
    labelKey: "import.type.visual_production_report",
    expectedTargets: ["skuCode", "corridor", "printJobId", "sessions", "title"],
    requiredTargets: ["skuCode", "corridor"],
  },
  manual_sku_list: {
    labelKey: "import.type.manual_sku_list",
    expectedTargets: [
      "skuCode",
      "article",
      "barcode",
      "marketplace",
      "title",
      "size",
      "color",
      "stockMode",
      "warehouse",
      "corridor",
      "productFamily",
      "skuName",
    ],
    requiredTargets: ["skuCode"],
  },
  manual_card_list: {
    labelKey: "import.type.manual_card_list",
    expectedTargets: [
      "skuCode",
      "article",
      "barcode",
      "marketplace",
      "title",
      "size",
      "color",
      "stockMode",
      "warehouse",
      "corridor",
      "productFamily",
      "cardTitle",
      "seoCluster",
    ],
    requiredTargets: ["skuCode", "cardTitle"],
  },
} as const;

export function schemaFor(kind: MarketplaceImportKind): ImportSchemaDefinition {
  return IMPORT_SCHEMAS[kind];
}
