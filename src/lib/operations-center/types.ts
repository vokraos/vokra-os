/**
 * AI Operations Center — execution-layer domain model.
 * API-shaped for future WB/Ozon connectors; all values carry explicit provenance.
 */

export const OPERATIONS_CENTER_SCHEMA_VERSION = 1 as const;

/** Honest data lineage — no silent “live marketplace” claims. */
export type DataProvenance = "estimated" | "inferred" | "memory-derived" | "manual";

export type WithProvenance<T> = {
  value: T;
  provenance: DataProvenance;
  /** Optional human-readable qualifier (locale applied at render). */
  detailKey?: string;
};

export type MarketplaceChannel = "wildberries" | "ozon" | "other";

/** Future API boundary — no network in V1. */
export type ExternalFeedStatus = "disconnected" | "placeholder" | "ready";

export type ExternalFeedPlaceholder = {
  channel: MarketplaceChannel;
  labelKey: string;
  status: ExternalFeedStatus;
  provenance: DataProvenance;
};

export type MemoryDerivedSignals = {
  projectTitle: string | null;
  skuCount: WithProvenance<number>;
  generationCount30d: WithProvenance<number>;
  visualAnalysisCount: WithProvenance<number>;
  uniqueCategories: WithProvenance<number>;
  lastActivityAt: WithProvenance<number | null>;
};

export type ManualOperationalBrief = {
  schemaVersion: typeof OPERATIONS_CENTER_SCHEMA_VERSION;
  prioritySkus: string;
  runwayNotes: string;
  productionBottleneckNote: string;
  /** 0–100, user-estimated production load */
  productionPressureManual: number | null;
  /** 0–100, user-estimated category crowding */
  categoryOverloadManual: number | null;
  /** 0–100, user-estimated ad load */
  adLoadManual: number | null;
  updatedAt: number;
};

export type OperationalAlertSeverity = "info" | "watch" | "risk" | "critical";

export type OperationalAlert = {
  id: string;
  severity: OperationalAlertSeverity;
  domain: string;
  titleKey: string;
  bodyKey: string;
  provenance: DataProvenance;
  /** Params for i18n interpolation */
  params?: Record<string, string | number>;
  /** Stable scenario id when body comes from offline scenario engine */
  scenarioId?: string;
  createdAt: number;
};

export type OperationalRecommendation = {
  id: string;
  priority: "p0" | "p1" | "p2";
  actionKey: string;
  rationaleKey: string;
  provenance: DataProvenance;
  relatedDomain: string;
  params?: Record<string, string | number>;
};

export type KpiRadarAxis = {
  id: string;
  labelKey: string;
  score: WithProvenance<number>;
};

export type SkuHeatCell = {
  skuId: string;
  label: string;
  category: string;
  intensity: WithProvenance<number>;
  tier: "winner" | "neutral" | "loser";
};

export type GrowthOpportunity = {
  id: string;
  titleKey: string;
  bodyKey: string;
  provenance: DataProvenance;
};

export type RiskWarning = {
  id: string;
  titleKey: string;
  bodyKey: string;
  severity: OperationalAlertSeverity;
  provenance: DataProvenance;
};

export type MarketplacePulse = {
  headlineKey: string;
  channels: ExternalFeedPlaceholder[];
  /** Narrative band, not live rank */
  visibilityBand: WithProvenance<"low" | "mid" | "high">;
  seasonalityKey: string;
  trendDriftKey: string;
};

export type ProductionPressure = {
  score: WithProvenance<number>;
  bottleneckSummaryKey: string;
};

export type PriorityAction = {
  id: string;
  rank: number;
  labelKey: string;
  provenance: DataProvenance;
};

export type OperationalScoreBreakdown = {
  total: WithProvenance<number>;
  memoryCoverage: WithProvenance<number>;
  skuDiscipline: WithProvenance<number>;
  contentVelocity: WithProvenance<number>;
  manualAlignment: WithProvenance<number>;
};

export type MarketplaceHealth = {
  index: WithProvenance<number>;
  ctrCrBandKey: string;
  stockDisciplineKey: string;
  adEfficiencyKey: string;
};

export type OperationsCenterSnapshot = {
  schemaVersion: typeof OPERATIONS_CENTER_SCHEMA_VERSION;
  computedAt: number;
  memory: MemoryDerivedSignals;
  manual: ManualOperationalBrief;
  operationalScore: OperationalScoreBreakdown;
  marketplaceHealth: MarketplaceHealth;
  alerts: OperationalAlert[];
  recommendations: OperationalRecommendation[];
  kpiRadar: KpiRadarAxis[];
  skuHeatmap: SkuHeatCell[];
  growthOpportunities: GrowthOpportunity[];
  riskWarnings: RiskWarning[];
  productionPressure: ProductionPressure;
  marketplacePulse: MarketplacePulse;
  priorityActions: PriorityAction[];
};
