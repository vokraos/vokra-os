/**
 * Phase 23 — Strategic SKU topology (no marketplace APIs, no catalog ingestion).
 */

export const SKU_INTEL_MEMORY_SCHEMA = "vokra.skuIntelligenceMemory.v1" as const;

export type SkuIntelRole =
  | "hero"
  | "support"
  | "amplifier"
  | "archive"
  | "recovery"
  | "disposable"
  | "expansion"
  | "test";

export type SkuLifecycleStage =
  | "emerging"
  | "scaling"
  | "dominant"
  | "overheating"
  | "cooling"
  | "recovering"
  | "archived";

/** Hero / corridor posture — narrative driver for executive lines. */
export type SkuHeroStatus =
  | "traffic_leader"
  | "corridor_anchor"
  | "expansion_amplifier"
  | "overheating"
  | "losing_gravity"
  | "amplifier_stress"
  | "recovery_window"
  | "stable";

export type SkuIntelligenceEntity = {
  id: string;
  skuCode: string;
  corridor: string;
  collectionId: string;
  role: SkuIntelRole;
  launchWaveId: string;
  heroStatus: SkuHeroStatus;
  saturationRisk: number;
  overlapRisk: number;
  refreshNeed: number;
  visualFatigue: number;
  seoPressure: number;
  marketplacePriority: number;
  productionComplexity: number;
  launchReadiness: number;
  linkedAssets: string[];
  linkedCardPlans: string[];
  lifecycleStage: SkuLifecycleStage;
  operationalNotes: string;
};

export type SkuIntelEventKind = "saturation" | "overlap" | "refresh" | "archive";

export type SkuIntelEvent = {
  kind: SkuIntelEventKind;
  code: string;
  corridor: string;
  skuCode: string;
  detail: string;
};

export type SkuIntelligenceSnapshot = {
  schema: typeof SKU_INTEL_MEMORY_SCHEMA;
  derivedAt: number;
  entities: SkuIntelligenceEntity[];
  events: SkuIntelEvent[];
  commands: string[];
  /** Optional echo from entity-core demo snapshot (strategic alignment, not live WB data). */
  entityCoreEcho: { spotlightKey: string | null; spotlightVars: Record<string, string> } | null;
};

export type SkuIntelligenceMemoryPayload = SkuIntelligenceSnapshot;
