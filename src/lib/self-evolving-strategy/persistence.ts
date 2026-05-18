import type {
  EvolutionTrajectoryPoint,
  IngestSelfEvolvingWorld,
  PersistedSelfEvolvingState,
  ExecutiveLearningLoopId,
} from "./types";
import { SELF_EVOLVING_SCHEMA_VERSION } from "./types";
import { applyLoopHeuristics } from "./loops";
import { computeAdaptationTargets } from "./adaptation";
import { DEFAULT_WEIGHTS, smoothWeights } from "./weighting";

import { clamp } from "../math";

const STORAGE_KEY = "vokra.selfEvolvingStrategy.v1";
const MAX_TRAJECTORY = 64;

function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

export function createInitialPersisted(): PersistedSelfEvolvingState {
  return {
    schemaVersion: SELF_EVOLVING_SCHEMA_VERSION,
    lastIngestPulse: -1,
    loops: {},
    weights: { ...DEFAULT_WEIGHTS },
    trajectory: [],
  };
}

export function loadPersistedSelfEvolvingStrategy(): PersistedSelfEvolvingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialPersisted();
    const p = JSON.parse(raw) as PersistedSelfEvolvingState;
    if (p.schemaVersion !== SELF_EVOLVING_SCHEMA_VERSION || !p.weights) return createInitialPersisted();
    const base = createInitialPersisted();
    return {
      ...base,
      ...p,
      weights: { ...DEFAULT_WEIGHTS, ...p.weights },
      trajectory: Array.isArray(p.trajectory) ? p.trajectory.slice(-MAX_TRAJECTORY) : [],
      loops: p.loops ?? {},
    };
  } catch {
    return createInitialPersisted();
  }
}

export function savePersistedSelfEvolvingStrategy(state: PersistedSelfEvolvingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function trajectoryFromWorld(w: IngestSelfEvolvingWorld, weights: PersistedSelfEvolvingState["weights"]): EvolutionTrajectoryPoint {
  const dragN = w.operationalDrag / 100;
  const cohN = w.narrativeCoherencePct / 100;
  const readiness = w.launchReadiness / 100;
  return {
    pulse: w.pulseGeneration,
    strategicMaturity01: clamp01(readiness * 0.55 + (1 - w.tension01) * 0.45),
    operationalDiscipline01: clamp01(1 - dragN * 0.85 + (weights.overloadToleranceMul - 1) * 0.4),
    premiumStability01: clamp01(cohN * 0.5 + weights.premiumDefenseSensitivityMul * 0.25),
    narrativeCoherence01: clamp01(cohN * 0.7 + (1 - w.riskBrandDilution / 100) * 0.3),
    executionResilience01: clamp01(w.executionConfidence / 100 + weights.routeConfidenceMul * 0.12),
    overloadSensitivity01: clamp01(dragN * 0.6 + (w.riskProductionOverload / 100) * 0.4),
    adaptationQuality01: clamp01(weights.simulationTrustMul * 0.35 + weights.narrativePatienceMul * 0.35 + (1 - w.tension01) * 0.3),
  };
}

export function ingestSelfEvolvingPulse(prev: PersistedSelfEvolvingState, w: IngestSelfEvolvingWorld): PersistedSelfEvolvingState {
  if (w.pulseGeneration <= prev.lastIngestPulse) return prev;
  const loops = applyLoopHeuristics(prev, w);
  const target = computeAdaptationTargets({ ...prev, loops });
  const weights = smoothWeights(prev.weights, target, 0.055);
  const point = trajectoryFromWorld(w, weights);
  const trajectory = [...prev.trajectory, point].slice(-MAX_TRAJECTORY);
  return {
    schemaVersion: SELF_EVOLVING_SCHEMA_VERSION,
    lastIngestPulse: w.pulseGeneration,
    loops,
    weights,
    trajectory,
  };
}

export function ensureLoopSeeds(state: PersistedSelfEvolvingState): PersistedSelfEvolvingState["loops"] {
  const ids: ExecutiveLearningLoopId[] = [
    "premium_capsules_recover_coherence",
    "low_sku_launches_stabilize_ops",
    "synchronized_reels_recovery",
    "parallel_launches_drag",
    "aggressive_seo_weakens_narrative",
    "oversized_fbo_overload_fulfillment",
  ];
  let loops = { ...state.loops };
  for (const id of ids) {
    if (!loops[id]) {
      loops[id] = {
        recurrence: 0,
        confidence01: 0.28,
        leverage01: 0.4,
        strategicImpact01: 0.38,
        stabilityDeltaSigned: 0,
        memoryWeight: "temporary",
      };
    }
  }
  return loops;
}
