/**
 * Future ingestion boundary — no live APIs in Phase 7–8.
 * Implementations will normalize WB/Ozon/production/warehouse payloads into `MarketplaceEntitySnapshot`.
 */

/** Phase 8 — fusion channels reserved for real-time sync (wire adapters later; no network here). */
export type FusionSignalChannelId =
  | "wb_market_live"
  | "ozon_performance_live"
  | "production_shift_report"
  | "warehouse_pressure_digest"
  | "ad_campaign_pulse"
  | "seo_visibility_stream"
  | "funnel_stage_metrics"
  | "fulfillment_sla_clock";

export function plannedFusionChannels(): readonly FusionSignalChannelId[] {
  return [
    "wb_market_live",
    "ozon_performance_live",
    "production_shift_report",
    "warehouse_pressure_digest",
    "ad_campaign_pulse",
    "seo_visibility_stream",
    "funnel_stage_metrics",
    "fulfillment_sla_clock",
  ];
}

export type IngestionSourceId =
  | "wb_api"
  | "ozon_api"
  | "production_excel"
  | "warehouse_report"
  | "ads_metrics"
  | "funnel_metrics"
  | "seo_metrics"
  | "fulfillment_report";

export interface EntityIngestionAdapter {
  readonly sourceId: IngestionSourceId;
  /** Reserved for future streaming ingest. */
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class StubEntityIngestionAdapter implements EntityIngestionAdapter {
  readonly sourceId: IngestionSourceId;

  constructor(sourceId: IngestionSourceId) {
    this.sourceId = sourceId;
  }

  async connect(): Promise<void> {
    /* no-op */
  }

  async disconnect(): Promise<void> {
    /* no-op */
  }
}

export function plannedIngestionSources(): IngestionSourceId[] {
  return [
    "wb_api",
    "ozon_api",
    "production_excel",
    "warehouse_report",
    "ads_metrics",
    "funnel_metrics",
    "seo_metrics",
    "fulfillment_report",
  ];
}
