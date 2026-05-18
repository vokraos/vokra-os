import type { NavId } from "../../types";
import type { CognitiveSynthesisState, DecisionEngineState, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import type { SignalFabricSnapshot } from "../signal-fabric/types";

/** Cognition windows — short gain vs long positioning */
export type TimeHorizonId = "d7" | "d30" | "d90" | "seasonal" | "longTail";

export type ScenarioId = "A" | "B" | "C";

/** Comparable future vectors (modelled 0–100, not live market data) */
export type ScenarioOutcomeVector = {
  revenuePace: number;
  saturationRisk: number;
  brandMemory: number;
  loyaltyDepth: number;
  ctrErosion: number;
  longTailSeoMomentum: number;
  premiumPerception: number;
  exclusivityLongRun: number;
};

export type ScenarioBranch = {
  id: ScenarioId;
  nameRu: string;
  nameEn: string;
  thesisRu: string;
  thesisEn: string;
  consequenceChainRu: readonly string[];
  consequenceChainEn: readonly string[];
  outcome: ScenarioOutcomeVector;
  /** Normalized path samples for branching visualization (0–1) */
  trajectory: readonly number[];
  probabilityMass: number;
};

export type ExecutiveForesightMetrics = {
  futureRiskHorizon: number;
  momentumStability: number;
  opportunityHalfLife: number;
  brandIntegrityForecast: number;
  saturationProbability: number;
  emotionalRetentionWindow: number;
  launchSurvivability: number;
  longTermMarginStability: number;
};

export type ResourceImpactForecast = {
  dtfQueueLoad: number;
  fboPressure: number;
  packagingBottleneck: number;
  contentProductionStrain: number;
  skuManagementComplexity: number;
  summaryRu: string;
  summaryEn: string;
};

export type MarketPressureSignal = {
  id: string;
  labelRu: string;
  labelEn: string;
  /** Relative intensity 0–100 at selected horizon */
  intensity: number;
  /** Narrative window (e.g. days band) */
  windowRu: string;
  windowEn: string;
};

export type ProbabilityFieldLayer = {
  id: string;
  labelRu: string;
  labelEn: string;
  weight: number;
  hue: number;
};

export type PredictiveEngineSnapshot = {
  horizon: TimeHorizonId;
  volatilityIndex: number;
  signalLongevity: number;
  expansionBias: number;
  decayPressure: number;
  scenarios: readonly ScenarioBranch[];
  foresight: ExecutiveForesightMetrics;
  resourceImpact: ResourceImpactForecast;
  marketPressure: readonly MarketPressureSignal[];
  probabilityLayers: readonly ProbabilityFieldLayer[];
  adaptiveMemoryRu: readonly string[];
  adaptiveMemoryEn: readonly string[];
  pulseGeneration: number;
};

export type PredictiveEngineInputs = {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  pulseGeneration: number;
  /** Optional signal fabric — adjusts volatility / decay pressure from live contour. */
  fabric?: SignalFabricSnapshot;
};
