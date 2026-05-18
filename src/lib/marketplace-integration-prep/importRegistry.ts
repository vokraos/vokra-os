import type { ImportSourceEntry } from "./types";

/** Manual-first import sources — registry only, no live ingest. */
export const IMPORT_SOURCE_REGISTRY: readonly ImportSourceEntry[] = [
  {
    id: "wb-sales",
    marketplace: "wildberries",
    importTypeKey: "import.type.wb_sales_report",
    targetModuleKey: "iready.target.skuIntelligence",
    status: "active_manual",
  },
  {
    id: "wb-stock",
    marketplace: "wildberries",
    importTypeKey: "import.type.wb_stock_report",
    targetModuleKey: "iready.target.productionPressure",
    status: "active_manual",
  },
  {
    id: "wb-card",
    marketplace: "wildberries",
    importTypeKey: "import.type.wb_card_report",
    targetModuleKey: "iready.target.cardProduction",
    status: "active_manual",
  },
  {
    id: "wb-ads",
    marketplace: "wildberries",
    importTypeKey: "import.type.wb_ads_report",
    targetModuleKey: "iready.target.advertisingPressure",
    status: "active_manual",
  },
  {
    id: "ozon-sales",
    marketplace: "ozon",
    importTypeKey: "import.type.ozon_sales_report",
    targetModuleKey: "iready.target.skuIntelligence",
    status: "active_manual",
  },
  {
    id: "ozon-stock",
    marketplace: "ozon",
    importTypeKey: "import.type.ozon_stock_report",
    targetModuleKey: "iready.target.productionPressure",
    status: "active_manual",
  },
  {
    id: "ozon-ads",
    marketplace: "ozon",
    importTypeKey: "import.type.ozon_ads_report",
    targetModuleKey: "iready.target.advertisingPressure",
    status: "active_manual",
  },
  {
    id: "manual-sku",
    marketplace: "internal",
    importTypeKey: "import.type.manual_sku_list",
    targetModuleKey: "iready.target.entityCore",
    status: "active_manual",
  },
  {
    id: "manual-card",
    marketplace: "internal",
    importTypeKey: "import.type.manual_card_list",
    targetModuleKey: "iready.target.cardProduction",
    status: "active_manual",
  },
  {
    id: "production-report",
    marketplace: "internal",
    importTypeKey: "import.type.production_report",
    targetModuleKey: "iready.target.productionPressure",
    status: "active_manual",
  },
] as const;
