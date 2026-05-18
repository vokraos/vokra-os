/**
 * Phase 7 — Entity core: normalized shapes for future WB/Ozon/production ingestion.
 * Presentation-only today; no network I/O.
 */

/** SKU / card / corridor vitality (aggregate-first). */
export type EntityLifecycleState =
  | "emerging"
  | "stabilizing"
  | "dominant"
  | "overloaded"
  | "fatigued"
  | "decaying"
  | "archived"
  | "amplifying"
  | "blocked"
  | "unstable"
  | "cooling"
  | "recovering";

export type OperationalStatus = "nominal" | "stressed" | "critical" | "halted" | "recovering";

export type StrategicRole =
  | "hero"
  | "anchor"
  | "amplifier"
  | "support"
  | "disposable"
  | "archive"
  | "recovery";

/** Hero / SKU strategic ladder — not every SKU is equal. */
export type HeroHierarchyKind = StrategicRole;

/** Marketplace terrain — geographic metaphor, aggregate fields. */
export type MarketplaceTerrainKind =
  | "premium_altitude"
  | "low_margin_swamp"
  | "saturation_ridge"
  | "visibility_canyon"
  | "recommendation_battlefield"
  | "semantic_deadzone"
  | "amplification_corridor";

/** Recommendation field layers (overlap, collision, …). */
export type RecommendationFieldKind =
  | "overlap"
  | "collision"
  | "visual_density"
  | "semantic"
  | "promo"
  | "saturation";

export type CorridorId = `corridor-${number}`;

export type EntityId = string;

/** Scalar envelope shared by aggregate entities (pressure / stability / …). */
export type EntityPressureEnvelope = {
  pressure01: number;
  stability01: number;
  saturation01: number;
  momentum01: number;
  lifecycle: EntityLifecycleState;
  operationalStatus: OperationalStatus;
  strategicRole: StrategicRole;
};

export type MarketplaceEntity = EntityPressureEnvelope & {
  id: "marketplace";
  labelKey: "depth.entity7.marketplace";
  childCorridorIds: CorridorId[];
  childLaunchWaveIds: EntityId[];
};

export type CorridorEntity = EntityPressureEnvelope & {
  id: CorridorId;
  nameKey: string;
  skuCount: number;
  heroDensity01: number;
  overlapRisk01: number;
  terrain: MarketplaceTerrainKind;
  parentId: "marketplace";
  childFamilyIds: EntityId[];
};

export type ProductFamilyEntity = EntityPressureEnvelope & {
  id: EntityId;
  label: string;
  parentCorridorId: CorridorId;
  childCardIds: EntityId[];
};

export type CardEntity = EntityPressureEnvelope & {
  id: EntityId;
  title: string;
  parentFamilyId: EntityId;
  childSkuIds: EntityId[];
};

export type SKUEntity = EntityPressureEnvelope & {
  id: EntityId;
  wbStyleId: string;
  parentCardId: EntityId;
  corridorId: CorridorId;
  hierarchy: HeroHierarchyKind;
};

export type HeroEntity = EntityPressureEnvelope & {
  id: EntityId;
  skuId: EntityId;
  hierarchy: "hero" | "anchor" | "amplifier";
  corridorId: CorridorId;
};

export type LaunchWaveEntity = EntityPressureEnvelope & {
  id: EntityId;
  waveIndex: 1 | 2 | 3 | 4 | 5;
  parentId: "marketplace";
  linkedCorridorIds: CorridorId[];
};

export type FulfillmentEntity = EntityPressureEnvelope & {
  id: "fulfillment";
  regionLabel: string;
  timingStrain01: number;
  shippingPressure01: number;
};

export type ProductionEntity = EntityPressureEnvelope & {
  id: "production";
  dtfThroughput01: number;
  packagingFatigue01: number;
  overnightRisk01: number;
  queueInstability01: number;
};

export type RecommendationFieldEntity = {
  id: EntityId;
  kind: RecommendationFieldKind;
  instability01: number;
  corridorId: CorridorId;
  rivalCorridorId: CorridorId;
};

/** Normalized graph for selectors + future hydration. */
export type MarketplaceEntitySnapshot = {
  version: 1;
  seed: number;
  tension01: number;
  pressure01: number;
  marketplace: MarketplaceEntity;
  corridors: Map<CorridorId, CorridorEntity>;
  families: Map<EntityId, ProductFamilyEntity>;
  cards: Map<EntityId, CardEntity>;
  skus: Map<EntityId, SKUEntity>;
  heroes: Map<EntityId, HeroEntity>;
  launchWaves: Map<EntityId, LaunchWaveEntity>;
  fulfillment: FulfillmentEntity;
  production: ProductionEntity;
  recommendationFields: Map<EntityId, RecommendationFieldEntity>;
  /** Ingestion-ready: ordered edge list (cause → effect). */
  relationEdges: readonly { from: EntityId; to: EntityId; relation: string }[];
};
