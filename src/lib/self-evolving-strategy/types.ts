/**
 * Self-Evolving Strategy — executive cognitive adaptation (not ML infra).
 * Weights and loops drift slowly from historical contour + Executive Memory patterns.
 */

export const SELF_EVOLVING_SCHEMA_VERSION = 1 as const;

export type MemoryWeightCategory = "canonical" | "strategic" | "temporary" | "volatile" | "discarded";

/** Named learning loops — observational recurrence in the organism. */
export type ExecutiveLearningLoopId =
  | "premium_capsules_recover_coherence"
  | "low_sku_launches_stabilize_ops"
  | "synchronized_reels_recovery"
  | "parallel_launches_drag"
  | "aggressive_seo_weakens_narrative"
  | "oversized_fbo_overload_fulfillment";

export type ExecutiveLearningLoop = {
  id: ExecutiveLearningLoopId;
  labelRu: string;
  recurrence: number;
  confidence01: number;
  leverage01: number;
  strategicImpact01: number;
  stabilityDeltaSigned: number;
  memoryWeight: MemoryWeightCategory;
};

/** Smoothed multipliers / biases — kept in a tight band for calm evolution. */
export type AdaptationWeightVector = {
  signalImportanceMul: number;
  initiativeUrgencyMul: number;
  routeConfidenceMul: number;
  simulationTrustMul: number;
  regimeProbabilityMul: number;
  strategicPressureMul: number;
  seoAggressivenessMul: number;
  premiumDefenseSensitivityMul: number;
  overloadToleranceMul: number;
  skuExpansionConfidenceMul: number;
  /** >0.5 = bias toward earlier visual reset windows */
  visualResetTimingBias01: number;
  narrativePatienceMul: number;
};

export type EvolutionTrajectoryPoint = {
  pulse: number;
  strategicMaturity01: number;
  operationalDiscipline01: number;
  premiumStability01: number;
  narrativeCoherence01: number;
  executionResilience01: number;
  overloadSensitivity01: number;
  adaptationQuality01: number;
};

export type PersistedSelfEvolvingState = {
  schemaVersion: typeof SELF_EVOLVING_SCHEMA_VERSION;
  lastIngestPulse: number;
  loops: Partial<
    Record<
      ExecutiveLearningLoopId,
      {
        recurrence: number;
        confidence01: number;
        leverage01: number;
        strategicImpact01: number;
        stabilityDeltaSigned: number;
        memoryWeight: MemoryWeightCategory;
      }
    >
  >;
  weights: AdaptationWeightVector;
  trajectory: EvolutionTrajectoryPoint[];
};

export type SelfEvolvingHints = {
  tensionDelta: number;
  confidenceDelta: number;
  stabilityDelta: number;
  stripRu: string | null;
};

/** Synchronous read path for Initiative / Predictive / Orchestrator / Organism (no React). */
export type SelfEvolvingSyncAdjustments = {
  initiativeLeverageBias: number;
  seoLeverageMul: number;
  productionLeverageMul: number;
  simulationVolatilityBias: number;
  executionConfidenceBias: number;
  organismStressBias: number;
  liveTensionDelta: number;
  liveConfidenceDelta: number;
  liveStabilityDelta: number;
  stripRu: string | null;
};

export type SelfEvolvingSnapshot = {
  pulseGeneration: number;
  weights: AdaptationWeightVector;
  weightDeltas: Partial<Record<keyof AdaptationWeightVector, number>>;
  loops: ExecutiveLearningLoop[];
  trajectory: EvolutionTrajectoryPoint[];
  maturity01: number;
  adaptationPressure01: number;
  degradedStrategyLabelsRu: string[];
  reinforcedStructureLabelsRu: string[];
  recoveredSystemsRu: string[];
  unstableBehaviorsRu: string[];
  futureVectorsRu: string[];
  evolvingConfidence01: number;
  summaryRu: string;
  hints: SelfEvolvingHints;
};

export type IngestSelfEvolvingWorld = {
  pulseGeneration: number;
  tension01: number;
  narrativeCoherencePct: number;
  operationalDrag: number;
  executionConfidence: number;
  initiativeCount: number;
  seoSaturation: number;
  riskBrandDilution: number;
  riskProductionOverload: number;
  fabricConflictCount: number;
  launchReadiness: number;
  emPatternIds: readonly string[];
  emDriftCaptionRu: string;
};
