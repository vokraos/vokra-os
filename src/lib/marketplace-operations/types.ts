import type { CardMarketplaceTarget } from "../card-production/types";

export const MOPS_MEMORY_SCHEMA = "vokra.marketplaceOperationsMemory.v1" as const;
export const MOPS_SESSION_SCHEMA = "vokra.marketplaceOperationsSession.v1" as const;
export const MOPS_SESSION_KEY = "vokra.marketplaceOperationsSession.v1";

export type LaunchWaveStatus =
  | "planning"
  | "assembling"
  | "ready"
  | "blocked"
  | "launched"
  | "paused"
  | "archived";

export type OpsRiskLevel = "low" | "medium" | "high";

/** Corridor-level aggregate (0–100 per lane). */
export type OperationalReadinessAggregate = {
  visualPct: number;
  seoPct: number;
  uploadPct: number;
  productionPct: number;
  packagingPct: number;
  fboPct: number;
  launchPct: number;
};

export type MopsExecutiveScenarioId =
  | "congested"
  | "fbo_fragile"
  | "lux_ready_expand"
  | "street_visual_fatigue"
  | "corporate_safe"
  | "ready_neutral"
  | "assembling_focus"
  | "blocked_generic";

export type LaunchWaveOperationalEntity = {
  id: string;
  collectionId: string;
  corridor: string;
  marketplace: CardMarketplaceTarget;
  cardPlanIds: string[];
  readiness: string;
  blockers: string[];
  launchPriority: number;
  operationalPressure: number;
  productionRisk: OpsRiskLevel;
  packagingRisk: OpsRiskLevel;
  fulfillmentRisk: OpsRiskLevel;
  launchStatus: LaunchWaveStatus;
  readinessAggregate: OperationalReadinessAggregate;
  bottlenecks: string[];
  commandCodes: string[];
  executiveScenarioId: MopsExecutiveScenarioId;
};

export type MarketplaceOperationalSnapshot = {
  waves: LaunchWaveOperationalEntity[];
  corridorReadiness: Record<string, OperationalReadinessAggregate>;
  globalBottlenecks: string[];
  globalCommandCodes: string[];
  stats: {
    planCount: number;
    waveCount: number;
    blockedWaves: number;
    readyWaves: number;
    assemblingWaves: number;
    globalReadyPlans: number;
  };
};

export type WavePatch = {
  launchStatus?: LaunchWaveStatus;
  launchPriority?: number;
};

export type MarketplaceOperationsSessionEnvelope = {
  schema: typeof MOPS_SESSION_SCHEMA;
  wavePatches: Record<string, WavePatch>;
  updatedAt: number;
};

/** Saved to Project Memory — patches + optional frozen snapshot. */
export type MarketplaceOperationsMemoryPayload = {
  schema: typeof MOPS_MEMORY_SCHEMA;
  savedAt: number;
  wavePatches: Record<string, WavePatch>;
  frozenSnapshot?: MarketplaceOperationalSnapshot;
};
