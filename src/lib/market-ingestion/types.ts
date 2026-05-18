/**
 * Phase 24 — Marketplace signal ingestion architecture (no APIs, no live fetch).
 * Unified signal language for future WB / Ozon / production sync.
 */

export const MARKET_INGESTION_MEMORY_SCHEMA = "vokra.marketIngestionMemory.v1" as const;

export type SignalPlatform = "wb" | "ozon" | "production" | "content" | "internal";

/** Executive prioritization for future live streams. */
export type SignalPriorityLevel = "ambient" | "monitored" | "elevated" | "dominant" | "critical";

/** Normalized envelope — one language for all sources. */
export type MarketplaceSignalEntity = {
  source: SignalPlatform;
  signalType: string;
  corridor: string;
  skuIds: string[];
  cardIds: string[];
  pressure: number;
  momentum: number;
  risk: number;
  leverage: number;
  operationalImpact: number;
  timestamp: number;
};

export type IngestionChannelId = string;

export type IngestionChannelDescriptor = {
  id: IngestionChannelId;
  platform: SignalPlatform;
  /** Logical grouping inside platform */
  category: string;
  /** i18n key under ingest.channel.* */
  labelKey: string;
  /** Stable hook id for future adapter binding */
  hook: string;
};

export type FusionSignalInputRef = {
  channelId: IngestionChannelId;
  /** Pattern / hint for matching normalized signalType in future */
  signalTypeHint: string;
};

/** Declarative fusion recipe — no execution in Phase 24. */
export type FusionRuleDefinition = {
  id: string;
  labelKey: string;
  inputs: FusionSignalInputRef[];
  outputRecommendationKey: string;
  defaultPriority: SignalPriorityLevel;
};

/** Future entity graph edges (documentation + persistence). */
export type EntityMappingDefinition = {
  id: string;
  /** Source anchor label */
  from: string;
  /** Target anchor label */
  to: string;
  labelKey: string;
};

export type BlockedIntegration = {
  id: string;
  reasonKey: string;
};

export type IngestionReadinessSnapshot = {
  schema: typeof MARKET_INGESTION_MEMORY_SCHEMA;
  derivedAt: number;
  /** Per-channel 0–100 architecture readiness (schemas + local OS hooks, not live data). */
  channelReadiness: Record<IngestionChannelId, number>;
  fusionReadiness: number;
  signalReadiness: number;
  operationalReadiness: number;
  blockedIntegrations: BlockedIntegration[];
  /** Structural examples only — derived from local session topology, not APIs. */
  sampleSignals: ReadonlyArray<MarketplaceSignalEntity>;
  fusionRules: ReadonlyArray<FusionRuleDefinition>;
  mappings: ReadonlyArray<EntityMappingDefinition>;
};

export type MarketIngestionMemoryPayload = IngestionReadinessSnapshot;

/** Future sync graph — documentation for persistence, not live links. */
export const ENTITY_MAPPINGS: readonly EntityMappingDefinition[] = [
  {
    id: "map.wb_article_sku",
    from: "wb:article_id",
    to: "sku_intelligence:SkuIntelligenceEntity",
    labelKey: "ingest.map.wb_article_sku",
  },
  {
    id: "map.ozon_offer_sku",
    from: "ozon:offer_id",
    to: "sku_intelligence:SkuIntelligenceEntity",
    labelKey: "ingest.map.ozon_offer_sku",
  },
  {
    id: "map.card_visuals",
    from: "card_production:CardProductionPlan",
    to: "visual_assets:VisualAssetEntity[]",
    labelKey: "ingest.map.card_visuals",
  },
  {
    id: "map.wave_ops",
    from: "marketplace_operations:LaunchWaveOperationalEntity",
    to: "operational_state:wavePatches",
    labelKey: "ingest.map.wave_ops",
  },
  {
    id: "map.prod_queue_pressure",
    from: "production:queue_snapshot",
    to: "marketplace_operations:operationalPressure",
    labelKey: "ingest.map.prod_queue_pressure",
  },
] as const;
