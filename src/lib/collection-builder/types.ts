/**
 * Phase 10 — Commercial collection entity (signal-derived, cluster-first).
 * No random print art; structured launch + production + SEO commitments.
 */

export type CollectionKindId =
  | "fast_dtf_test_capsule"
  | "premium_capsule"
  | "seasonal_drop"
  | "gift_collection"
  | "evergreen_basics_line"
  | "trend_capture_wave"
  | "visual_refresh_collection"
  | "fbo_scale_collection"
  | "brand_building_capsule";

export type StrategicCollectionRole =
  | "margin_expansion"
  | "shelf_defense"
  | "launch_recovery"
  | "brand_tightening"
  | "volume_scale"
  | "trend_arbitrage"
  | "production_sync";

export type SkuClusterRole =
  | "hero"
  | "support"
  | "amplifier"
  | "archive"
  | "fbo_candidate"
  | "refresh_candidate";

export type SkuCluster = {
  role: SkuClusterRole;
  label: string;
  count: number;
  note: string;
};

export type HeroProductDef = {
  title: string;
  note: string;
};

export type VisualDirectionBlock = {
  mood: string;
  printDirection: string;
  forbiddenPatterns: readonly string[];
  heroCardDirection: string;
  modelBackgroundStyle: string;
  marketplaceMainPhotoLogic: string;
  reelsDirection: string;
};

export type SeoPlanBlock = {
  primaryCluster: string;
  secondaryClusters: readonly string[];
  forbiddenSemanticDrift: readonly string[];
  titleTone: string;
  richContentAngle: string;
  wbVsOzon: string;
};

export type LaunchWavePlan = {
  testWave: string;
  refreshWave: string;
  amplificationWave: string;
  fboWave: string;
  holdStopCondition: string;
  launchOrder: string;
  doNotLaunch: string;
};

export type ProductionFitBlock = {
  dtfSuitability: string;
  printComplexity: string;
  skuComplexity: string;
  packagingPressure: string;
  fboPrepPressure: string;
  launchSpeed: string;
  productionRisk: string;
  operationalWarning: string | null;
};

export type CollectionIntegrationRefs = {
  executiveBestNext: string;
  primaryRouteId: string;
  primaryRouteKind: string;
  orchestratorObjective: string;
  signalFabricNote: string;
  temporalNote: string;
  dominantCluster: string;
  brandDnaGovernance: string;
};

export type CollectionEntity = {
  id: string;
  generatedAt: number;
  pulseSeed: number;
  kind: CollectionKindId;
  name: string;
  concept: string;
  corridorId: string;
  corridorNameKey: string;
  corridorPressure01: number;
  opportunityReason: string;
  targetBuyer: string;
  seasonTiming: string;
  brandFit: string;
  marketplaceFit: string;
  productionFit: ProductionFitBlock;
  strategicRole: StrategicCollectionRole;
  heroProducts: readonly HeroProductDef[];
  skuClusters: readonly SkuCluster[];
  skuCountTarget: { min: number; max: number };
  visualDirection: VisualDirectionBlock;
  seoPlan: SeoPlanBlock;
  launchPlan: LaunchWavePlan;
  risk: string;
  stopConditions: readonly string[];
  expectedImpact: string;
  integration: CollectionIntegrationRefs;
};
