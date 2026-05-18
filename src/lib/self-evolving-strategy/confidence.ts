import type { ExecutiveLearningLoopId, PersistedSelfEvolvingState } from "./types";
import { weightCategoryForLoop } from "./weighting";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Bayesian-ish confidence bump from a reinforcing observation. */
export function reinforceLoopConfidence(prev: number, signal01: number): number {
  return clamp01(prev * 0.97 + signal01 * 0.06);
}

export function decayLoopConfidence(prev: number, noise01: number): number {
  return clamp01(prev * 0.995 - noise01 * 0.02);
}

export function mergeLoopState(
  loops: PersistedSelfEvolvingState["loops"],
  id: ExecutiveLearningLoopId,
  patch: { leverageSignal: number; stabilitySignal: number; impactSignal: number },
): PersistedSelfEvolvingState["loops"] {
  const cur = loops[id] ?? {
    recurrence: 0,
    confidence01: 0.35,
    leverage01: 0.45,
    strategicImpact01: 0.4,
    stabilityDeltaSigned: 0,
    memoryWeight: "temporary" as const,
  };
  const recurrence = cur.recurrence + 1;
  const confidence01 = reinforceLoopConfidence(cur.confidence01, patch.leverageSignal * 0.5 + 0.25);
  const leverage01 = clamp01(cur.leverage01 * 0.96 + patch.leverageSignal * 0.08);
  const strategicImpact01 = clamp01(cur.strategicImpact01 * 0.97 + patch.impactSignal * 0.05);
  const stabilityDeltaSigned = cur.stabilityDeltaSigned * 0.92 + patch.stabilitySignal * 0.12;
  const memoryWeight = weightCategoryForLoop(confidence01, recurrence);
  return {
    ...loops,
    [id]: {
      recurrence,
      confidence01,
      leverage01,
      strategicImpact01,
      stabilityDeltaSigned,
      memoryWeight,
    },
  };
}
