import type { NavId } from "../../types";
import type { InitiativeMemory, StrategicInitiative } from "../initiative-engine/types";

export type MarketRegime = "opportunity" | "saturation" | "production_load" | "balanced";

/** Вектор стратегического ранжирования возможности (0–100) */
export type StrategicRankVector = {
  strategic: number;
  executionDifficulty: number;
  marginPotential: number;
  saturationRisk: number;
  speedPotential: number;
  brandFit: number;
  seoLeverage: number;
  productionFit: number;
};

/** Оркестрация запуска — рекомендация с обоснованием */
export type LaunchOrchestration = {
  archetypeRu: string;
  reasoningRu: string;
  timingRu: string;
  resourceLoadRu: string;
  expectedImpactRu: string;
  risksRu: string;
};

/** Исполнительный слой рассуждений поверх синтеза */
export type DecisionEngineState = {
  priorityHeadlineRu: string;
  priorityDensityRu: string;
  priorityAccelerateRu: string;
  riskSaturationProb: number;
  riskCtrFatigue: number;
  riskProductionOverload: number;
  riskBrandDilution: number;
  riskPricingPressure: number;
  resourceProductionRu: string;
  resourceSkuRu: string;
  resourceMarketingRu: string;
  timingWindowRu: string;
  timingSeasonalRu: string;
  timingMomentumRu: string;
  timingMarketplaceRu: string;
  /** Почему это важно сейчас — связный стратегический текст */
  executiveReasoningRu: string;
  opportunityLabelRu: string;
  rank: StrategicRankVector;
  launch: LaunchOrchestration;
  /** Память исполнения: что контур уже знает о прошлых исходах */
  executiveMemoryRu: string;
};

/** Синтез: приоритеты и «память» контура поверх всех модулей */
export type CognitiveSynthesisState = {
  regime: MarketRegime;
  topOpportunityRu: string;
  biggestRiskRu: string;
  activeMissionRu: string;
  pressureIndex: number;
  launchReadiness: number;
  dominantClusterRu: string;
  memoryEchoRu: string;
  causeEffectRu: string | null;
};

/** Узлы, участвующие в общей нервной сети (home — вне контура) */
export const COGNITIVE_NETWORK_IDS = [
  "missionControl",
  "executiveIntelligence",
  "organismModel",
  "strategicSimulation",
  "temporalStrategy",
  "executionPlanner",
  "executionOrchestrator",
  "signalFabric",
  "feedbackLoop",
  "command",
  "operations",
  "operationsBrief",
  "seo",
  "rich",
  "reels",
  "dna",
  "brandEvolution",
  "visual",
  "visualStrategy",
  "competitors",
  "competitiveMap",
  "trends",
  "analytics",
  "memory",
  "executiveMemory",
  "strategyEvolution",
  "campaign",
  "prompts",
  "promptComposer",
  "promptPack",
  "visualProduction",
  "visualAssets",
  "cardProduction",
  "marketplaceOperations",
  "skuIntelligence",
  "ingestionReadiness",
  "dataImport",
  "entityFusion",
  "dataCleanup",
  "assortmentActions",
  "collectionBuilder",
  "dashboard",
] as const satisfies readonly NavId[];

export type CognitiveNetworkId = (typeof COGNITIVE_NETWORK_IDS)[number];

export type ActivityMode = "steady" | "active" | "priority" | "sync";

export type SyncMode = "synced" | "catchup" | "drift";

/** Режим надзора Brand DNA над модулем */
export type BrandGate = "ok" | "watch" | "hold";

export type ModuleCognitiveSnapshot = {
  activity: ActivityMode;
  signalHealth: number;
  sync: SyncMode;
  pressure: number;
  confidence: number;
  incomingRu: string | null;
  outgoingRu: string | null;
  brandGate: BrandGate;
};

export type CognitivePulseEvent = {
  id: string;
  source: NavId;
  titleRu: string;
  detailRu: string;
  targets: readonly NavId[];
};

export type CognitiveOsState = {
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  lastEvent: CognitivePulseEvent | null;
  pulseGeneration: number;
  brandDnaSurfaceActive: boolean;
  /** Autonomous initiative engine — scan generation bumps on interval */
  initiativeScanGeneration: number;
  initiativeMemory: InitiativeMemory;
  initiatives: readonly StrategicInitiative[];
};
