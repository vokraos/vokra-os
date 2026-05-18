/**
 * Organism Model Layer — living company-state (not ERP / finance / BI).
 * Russian-first UI; allowed: SEO, CTR, SKU, DTF, FBO, WB, Ozon, premium.
 */

export type HealthAxis =
  | "production"
  | "launch"
  | "content"
  | "seo"
  | "marketplace"
  | "premium_perception"
  | "narrative"
  | "execution";

export type SystemHealth = {
  overall: number;
  axes: readonly {
    axis: HealthAxis;
    labelRu: string;
    score: number;
    pulseRu: string;
  }[];
};

export type OperationalStress = {
  index: number;
  summaryRu: string;
  driversRu: readonly string[];
};

export type GrowthPressure = {
  index: number;
  vectorRu: string;
  safeGrowthRu: string;
};

export type CognitiveLoad = {
  index: number;
  narrativeCoherence: number;
  focusRu: string;
};

export type ResourceFlow = {
  id: string;
  channelRu: string;
  /** 0–100 share of organizational «energy» (model, not accounting) */
  share: number;
  stateRu: string;
};

export type AttentionAllocation = {
  summaryRu: string;
  hotspotsRu: readonly string[];
  dilutionRisk: number;
};

export type BurnoutRisk = {
  index: number;
  factorsRu: readonly string[];
  captionRu: string;
};

export type ExpansionCapacity = {
  index: number;
  skuScale: number;
  categoryExpand: number;
  fboIncrease: number;
  capsules: number;
  newNiches: number;
  verdictRu: string;
};

export type StabilityIndex = {
  value: number;
  interpretationRu: string;
};

export type StrategicEnergy = {
  reserve: number;
  spendRateRu: string;
  recoveryWindowRu: string;
};

export type ExecutionFatigue = {
  index: number;
  sourcesRu: readonly string[];
  reliefRu: string;
};

export type OrganismIntegrationTie = {
  id: string;
  layerRu: string;
  tieRu: string;
};

export type OrganismState = {
  generatedAt: number;
  pulseGeneration: number;
  /** Lattice narrative — how organism model reads other OS layers */
  integrationTies: readonly OrganismIntegrationTie[];
  /** Section 1 */
  systemSummaryRu: string;
  systemHealth: SystemHealth;
  /** Section 2 */
  loadMapRu: readonly { zoneRu: string; load: number; noteRu: string }[];
  operationalStress: OperationalStress;
  /** Section 3 */
  resourceFlows: readonly ResourceFlow[];
  attentionAllocation: AttentionAllocation;
  /** Section 4 */
  strategicEnergy: StrategicEnergy;
  brandEnergyRu: string;
  /** Section 5 */
  overheatingRisk: BurnoutRisk;
  /** Section 6 */
  growthResilience: number;
  growthPressure: GrowthPressure;
  cognitiveLoad: CognitiveLoad;
  /** Section 7 */
  executionFatigue: ExecutionFatigue;
  /** Section 8 */
  lossZonesRu: readonly string[];
  /** Section 9 */
  expansionCapacity: ExpansionCapacity;
  underutilizationRu: readonly string[];
  overloadSignalsRu: readonly string[];
  /** Section 10 */
  stabilityIndex: StabilityIndex;
  stabilityNarrativeRu: string;
  /** Cross-layer anchor */
  executiveAlignmentRu: string;
};
