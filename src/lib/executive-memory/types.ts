/**
 * Executive Memory Layer — strategic epochs, patterns, drift, weighted recall.
 * Russian-first summaries; persistence is local and bounded.
 */

import type { MarketRegime } from "../cognitive-os/types";
import type { ExecutiveRegimeProfile } from "../live-state/types";
import type { TemporalPhase } from "../temporal-strategy/types";
import type { InitiativeUrgency } from "../initiative-engine/types";

export const EXECUTIVE_MEMORY_SCHEMA_VERSION = 1 as const;

/** Strategic epoch archetypes — derived from regime + tension + temporal contour. */
export type StrategicEpochKind =
  | "premium_expansion"
  | "silent_accumulation"
  | "saturation_recovery"
  | "seo_depth_cycle"
  | "narrative_decay"
  | "hero_amplification"
  | "motion_rebuild"
  | "operational_overload"
  | "premium_defense"
  | "visual_reset"
  | "balanced_observation";

export type MemoryWeightCategory = "canonical" | "strategic" | "temporary" | "volatile" | "discarded";

export type PulseMemorySample = {
  pulse: number;
  regime: MarketRegime;
  executiveProfile: ExecutiveRegimeProfile;
  tension01: number;
  pressureIndex: number;
  operationalDrag: number;
  executionConfidence: number;
  ctrFatigue: number;
  visualFatigue: number;
  seoSaturation: number;
  riskBrandDilution: number;
  riskProductionOverload: number;
  initiativeCount: number;
  fabricConflictCount: number;
  temporalPhase: TemporalPhase;
  launchReadiness: number;
  memoryGenerationCount: number;
  organismOperationalStress: number;
  organismNarrativeCoherence: number;
  predictiveVolatility01: number;
  simHorizonId: string;
  initiativeLabelsRu: readonly string[];
};

export type StrategicEpoch = {
  id: string;
  kind: StrategicEpochKind;
  startPulse: number;
  endPulse: number | null;
  dominantRegime: MarketRegime;
  executiveProfile: ExecutiveRegimeProfile;
  strategicTension01: number;
  narrativeStateRu: string;
  premiumPerceptionDelta01: number;
  operationalStress01: number;
  memoryWeight: MemoryWeightCategory;
  keyInitiativesRu: readonly string[];
  linkedSimulationsRu: readonly string[];
  linkedLaunchesRu: readonly string[];
  executiveSummaryRu: string;
};

export type ExecutivePatternId =
  | "premium_launch_stability"
  | "motion_recovery_ctr"
  | "parallel_initiative_dilution"
  | "aggressive_seo_hero_drift"
  | "execution_wave_overload"
  | "reels_hero_sync_recovery";

export type ExecutivePattern = {
  id: ExecutivePatternId;
  labelRu: string;
  confidence01: number;
  recurrence: number;
  historicalLeverage01: number;
  weightCategory: MemoryWeightCategory;
};

export type DriftAccumulator = {
  brandDnaDrift01: number;
  narrativeDilution01: number;
  executiveFragmentation01: number;
  operationalDragAcc01: number;
  seoSaturationGrowth01: number;
  visualFatigueAcc01: number;
  premiumPerceptionErosion01: number;
};

export type DriftDetection = "slow_degradation" | "recurring_instability" | "recovery_cycle" | "stable";

export type HistoricalDriftState = DriftAccumulator & {
  detection: DriftDetection;
  captionRu: string;
};

export type CanonicalMemoryItem = {
  id: string;
  titleRu: string;
  bodyRu: string;
  weight: MemoryWeightCategory;
  anchoredPulse: number;
};

export type StrategicScar = {
  id: string;
  labelRu: string;
  severity01: number;
  originEpochKind: StrategicEpochKind;
  lessonRu: string;
};

export type RecoveryLandmark = {
  id: string;
  labelRu: string;
  pulse: number;
  deltaTension01: number;
  noteRu: string;
};

export type LaunchMistake = {
  id: string;
  pattern: ExecutivePatternId;
  labelRu: string;
  recurrence: number;
  lastPulse: number;
};

export type ExecutiveMemoryHints = {
  /** Added to live strategic tension (clamped). */
  tensionBias: number;
  /** Added to confidence settling (clamped). */
  confidenceBias: number;
  /** Added to stability inertia (clamped). */
  stabilityBias: number;
  /** Small bias toward volatility in simulation framing (consumer may scale). */
  simulationProbBias: number;
  /** Initiative engine downstream: multiply implicit priority heat slightly. */
  initiativeWeightMul: number;
  stripEchoRu: string | null;
};

export type PersistedExecutiveMemoryState = {
  schemaVersion: typeof EXECUTIVE_MEMORY_SCHEMA_VERSION;
  samples: PulseMemorySample[];
  epochs: StrategicEpoch[];
  patternStats: Partial<
    Record<
      ExecutivePatternId,
      {
        hits: number;
        lastPulse: number;
        leverageEMA: number;
      }
    >
  >;
  drift: DriftAccumulator;
  lastIngestPulse: number;
  /** Last pulse where contour entered recovery-class epoch (for drift gap). */
  lastRecoveryPulse: number;
};

export type ExecutiveMemorySnapshot = {
  pulseGeneration: number;
  persistedSampleCount: number;
  /** Saved generation records in Project Memory at last ingested cognitive pulse (contour signal, not file merge). */
  projectMemoryInfluenceCount: number;
  narrativeStateRu: string;
  epochs: readonly StrategicEpoch[];
  patterns: readonly ExecutivePattern[];
  drift: HistoricalDriftState;
  canonicalMemories: readonly CanonicalMemoryItem[];
  strategicScars: readonly StrategicScar[];
  recoveredStates: readonly RecoveryLandmark[];
  launchMistakes: readonly LaunchMistake[];
  historicalPressureMap: readonly { labelRu: string; value01: number }[];
  longTermCoherence01: number;
  strongestRecoveriesRu: readonly string[];
  executiveSummaryRu: string;
  hints: ExecutiveMemoryHints;
};

export type IngestWorldPulse = {
  pulseGeneration: number;
  regime: MarketRegime;
  executiveProfile: ExecutiveRegimeProfile;
  tension01: number;
  synthesis: {
    pressureIndex: number;
    launchReadiness: number;
  };
  decision: {
    riskCtrFatigue: number;
    riskBrandDilution: number;
    riskSaturationProb: number;
    riskProductionOverload: number;
  };
  orchestration: {
    executionConfidence: number;
    operationalDrag: number;
  };
  temporal: {
    phase: TemporalPhase;
    decay: { ctrFatigue: number; visualFatigue: number; seoSaturation: number };
  };
  initiatives: { count: number; topLabelsRu: readonly string[] };
  initiativeUrgency: InitiativeUrgency;
  fabricConflictCount: number;
  memoryGenerationCount: number;
  organism: {
    operationalStress: number;
    narrativeCoherence: number;
  };
  predictive: { volatilityIndex: number } | null;
  simHorizonId: string;
};
