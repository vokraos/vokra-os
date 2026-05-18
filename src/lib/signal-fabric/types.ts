/**
 * Signal Fabric — system-wide causal neural layer (nodes, edges, cascades, pressure).
 * Russian-first labels for OS copy; module keys align with navigation / cognitive contour.
 */

import type { NavId } from "../../types";

/** Contour modules participating in the fabric (Initiative Engine is not a Nav page). */
export type FabricModuleKey =
  | "missionControl"
  | "trends"
  | "command"
  | "strategicSimulation"
  | "temporalStrategy"
  | "executionPlanner"
  | "executionOrchestrator"
  | "initiativeEngine"
  | "dna"
  | "seo"
  | "visual"
  | "rich"
  | "reels"
  | "campaign"
  | "analytics"
  | "memory"
  | "operations";

export type SignalCategory =
  | "TREND_SIGNAL"
  | "SEO_SIGNAL"
  | "VISUAL_SIGNAL"
  | "BRAND_SIGNAL"
  | "PRODUCTION_SIGNAL"
  | "MARKET_SIGNAL"
  | "MEMORY_SIGNAL"
  | "EXECUTION_SIGNAL";

export type SignalUrgency = "critical" | "high" | "standard" | "observe";

export type SignalNode = {
  id: FabricModuleKey;
  labelRu: string;
  /** 0–100 aggregate activation */
  activation: number;
  /** Cognitive pressure from module snapshot */
  pressure: number;
  confidence: number;
  syncRu: string;
};

export type SignalEdge = {
  id: string;
  from: FabricModuleKey;
  to: FabricModuleKey;
  /** 0–100 route intensity */
  intensity: number;
  /** seconds-ish for UI animation speed hint */
  flowDurationSec: number;
  labelRu: string;
};

export type SignalEvent = {
  id: string;
  type: SignalCategory;
  source: FabricModuleKey;
  targets: readonly FabricModuleKey[];
  intensity: number;
  confidence: number;
  urgency: SignalUrgency;
  causeRu: string;
  effectRu: string;
  timestamp: number;
  lifespanMs: number;
  labelRu: string;
  explanationRu: string;
};

export type SignalPropagation = {
  id: string;
  path: readonly FabricModuleKey[];
  headModule: FabricModuleKey;
  tailModule: FabricModuleKey;
  intensity: number;
  labelRu: string;
};

export type SignalPressureMap = {
  market: number;
  brand: number;
  production: number;
  seo: number;
  visual: number;
  execution: number;
  memory: number;
};

export type SignalConflict = {
  id: string;
  modules: readonly FabricModuleKey[];
  severity: number;
  labelRu: string;
  resolutionRu: string;
};

export type SignalCascade = {
  id: string;
  titleRu: string;
  stepsRu: readonly string[];
  headIntensity: number;
};

export type ModuleInfluence = {
  module: FabricModuleKey;
  outgoing: readonly FabricModuleKey[];
  incoming: readonly FabricModuleKey[];
  influenceScore: number;
  noteRu: string;
};

export type CausalChain = {
  id: string;
  titleRu: string;
  links: readonly { causeRu: string; effectRu: string; modules: readonly FabricModuleKey[] }[];
};

export type SignalStreamEntry = {
  id: string;
  at: number;
  type: SignalCategory;
  source: FabricModuleKey;
  targets: readonly FabricModuleKey[];
  urgency: SignalUrgency;
  confidence: number;
  causeRu: string;
  effectRu: string;
  labelRu: string;
};

export type SignalFabricSnapshot = {
  generatedAt: number;
  pulseGeneration: number;
  nodes: readonly SignalNode[];
  edges: readonly SignalEdge[];
  events: readonly SignalEvent[];
  propagations: readonly SignalPropagation[];
  pressures: SignalPressureMap;
  conflicts: readonly SignalConflict[];
  cascades: readonly SignalCascade[];
  moduleInfluence: readonly ModuleInfluence[];
  causalChains: readonly CausalChain[];
  stream: readonly SignalStreamEntry[];
  /** Mission Control core — composite thermal load */
  corePressure: number;
  propagationLogRu: readonly string[];
};

/** Map fabric keys to NavId for routing (sidebar). */
export const FABRIC_KEY_TO_NAV: Partial<Record<FabricModuleKey, NavId>> = {
  missionControl: "missionControl",
  trends: "trends",
  command: "command",
  strategicSimulation: "strategicSimulation",
  temporalStrategy: "temporalStrategy",
  executionPlanner: "executionPlanner",
  executionOrchestrator: "executionOrchestrator",
  dna: "dna",
  seo: "seo",
  visual: "visual",
  rich: "rich",
  reels: "reels",
  campaign: "campaign",
  analytics: "analytics",
  memory: "memory",
  operations: "operations",
};
