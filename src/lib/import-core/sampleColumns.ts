import type { MarketplaceImportKind } from "./types";

/**
 * Representative column headers (RU / EN mix) as if exported from seller UI — not live data.
 */
export const SAMPLE_COLUMNS_BY_IMPORT: Readonly<Record<MarketplaceImportKind, readonly string[]>> = {
  wb_sales_report: ["Артикул продавца", "Номенклатура", "Баркод", "Заказы", "Выкупы", "Выручка, ₽", "Склад"],
  wb_stock_report: ["Артикул", "nmID", "Баркод", "Остаток", "Склад отгрузки", "Наименование"],
  wb_card_report: ["Артикул", "nmID", "Баркод", "Предмет", "Цена до скидки", "Склад"],
  wb_ads_report: ["Артикул", "nmID", "Показы", "Переходы", "CTR, %", "Заказы", "Расход, ₽"],
  ozon_sales_report: ["Артикул Ozon", "Offer ID", "Штрихкод", "Заказано", "Выручка", "SKU name"],
  ozon_stock_report: ["Offer ID", "Артикул продавца", "FBS остаток", "Склад", "EAN"],
  ozon_ads_report: ["Offer ID", "SKU", "Показы", "Клики", "CTR", "Расход"],
  production_report: ["job_id", "SKU", "queue_depth", "shift_h", "corridor"],
  visual_production_report: ["sku", "corridor", "batch", "sessions", "card_title"],
  manual_sku_list: ["SKU", "Артикул", "Баркод", "Маркетплейс", "Название", "Размер", "Цвет", "Склад", "Коридор"],
  manual_card_list: ["skuCode", "cardTitle", "seoCluster", "marketplace", "barcode", "title", "corridor", "warehouse"],
} as const;
