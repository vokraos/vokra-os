import type { FusionRuleDefinition } from "./types";

/**
 * Fusion recipes: when multiple normalized signals align, emit a recommendation.
 * Execution deferred — structure only.
 */
export const FUSION_RULES: readonly FusionRuleDefinition[] = [
  {
    id: "fusion.refresh_from_ctr_fatigue",
    labelKey: "ingest.fusion.refresh_ctr_fatigue",
    inputs: [
      { channelId: "wb.ctr", signalTypeHint: "ctr_drop" },
      { channelId: "content.hero_visuals", signalTypeHint: "visual_fatigue" },
      { channelId: "content.refreshes", signalTypeHint: "overlap" },
    ],
    outputRecommendationKey: "ingest.fusion.out.refresh_visual_corridor",
    defaultPriority: "elevated",
  },
  {
    id: "fusion.pause_launch_pressure",
    labelKey: "ingest.fusion.pause_launch_pressure",
    inputs: [
      { channelId: "prod.print_load", signalTypeHint: "overload" },
      { channelId: "prod.packaging", signalTypeHint: "pressure" },
      { channelId: "wb.cards", signalTypeHint: "launch_density" },
    ],
    outputRecommendationKey: "ingest.fusion.out.pause_launch_wave",
    defaultPriority: "dominant",
  },
  {
    id: "fusion.stock_search_divergence",
    labelKey: "ingest.fusion.stock_search",
    inputs: [
      { channelId: "wb.stock", signalTypeHint: "stockout_risk" },
      { channelId: "wb.search", signalTypeHint: "visibility_drop" },
    ],
    outputRecommendationKey: "ingest.fusion.out.rebalance_allocation",
    defaultPriority: "monitored",
  },
  {
    id: "fusion.ozon_indexing_revenue",
    labelKey: "ingest.fusion.ozon_index_revenue",
    inputs: [
      { channelId: "ozon.indexing", signalTypeHint: "indexing_lag" },
      { channelId: "ozon.revenue", signalTypeHint: "soft_conversion" },
    ],
    outputRecommendationKey: "ingest.fusion.out.ozon_listing_audit",
    defaultPriority: "elevated",
  },
] as const;
