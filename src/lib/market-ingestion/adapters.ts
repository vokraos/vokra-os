import type { SignalPlatform } from "./types";

/** Future adapter contract — no network in Phase 24. */
export type IngestionAdapterDescriptor = {
  id: string;
  platform: SignalPlatform;
  /** Channel hooks this adapter will own when implemented */
  channelHooks: string[];
  /** i18n key */
  labelKey: string;
  status: "stub" | "schema_ready";
};

export const INGESTION_ADAPTERS: readonly IngestionAdapterDescriptor[] = [
  {
    id: "adapter.wb.content_api",
    platform: "wb",
    channelHooks: ["wb.cards", "wb.seo", "wb.ads", "wb.search", "wb.stock", "wb.fbo_fbs", "wb.regions"],
    labelKey: "ingest.adapter.wb",
    status: "stub",
  },
  {
    id: "adapter.wb.analytics_api",
    platform: "wb",
    channelHooks: ["wb.ctr", "wb.cr", "wb.buyout"],
    labelKey: "ingest.adapter.wb_analytics",
    status: "stub",
  },
  {
    id: "adapter.ozon.seller_api",
    platform: "ozon",
    channelHooks: ["ozon.cards", "ozon.ads", "ozon.search", "ozon.stock", "ozon.revenue", "ozon.indexing"],
    labelKey: "ingest.adapter.ozon",
    status: "stub",
  },
  {
    id: "adapter.production.mes",
    platform: "production",
    channelHooks: ["prod.dtf_queues", "prod.packaging", "prod.blanks", "prod.print_load", "prod.shift_load"],
    labelKey: "ingest.adapter.production",
    status: "schema_ready",
  },
  {
    id: "adapter.content.os",
    platform: "content",
    channelHooks: ["content.hero_visuals", "content.refreshes", "content.reels", "content.rich_content"],
    labelKey: "ingest.adapter.content",
    status: "schema_ready",
  },
] as const;
