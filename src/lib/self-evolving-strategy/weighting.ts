import type { AdaptationWeightVector, MemoryWeightCategory } from "./types";
import { clamp } from "../math";

export const DEFAULT_WEIGHTS: AdaptationWeightVector = {
  signalImportanceMul: 1,
  initiativeUrgencyMul: 1,
  routeConfidenceMul: 1,
  simulationTrustMul: 1,
  regimeProbabilityMul: 1,
  strategicPressureMul: 1,
  seoAggressivenessMul: 1,
  premiumDefenseSensitivityMul: 1,
  overloadToleranceMul: 1,
  skuExpansionConfidenceMul: 1,
  visualResetTimingBias01: 0.5,
  narrativePatienceMul: 1,
};

/** Smooth toward target (executive patience — low alpha). */
export function smoothWeights(cur: AdaptationWeightVector, target: AdaptationWeightVector, alpha = 0.06): AdaptationWeightVector {
  const keys = Object.keys(cur) as (keyof AdaptationWeightVector)[];
  const out = { ...cur };
  for (const k of keys) {
    const c = cur[k];
    const t = target[k];
    if (typeof c === "number" && typeof t === "number") {
      (out as Record<string, number>)[k] = c + (t - c) * alpha;
    }
  }
  out.seoAggressivenessMul = clamp(out.seoAggressivenessMul, 0.88, 1.12);
  out.premiumDefenseSensitivityMul = clamp(out.premiumDefenseSensitivityMul, 0.88, 1.12);
  out.overloadToleranceMul = clamp(out.overloadToleranceMul, 0.85, 1.12);
  out.skuExpansionConfidenceMul = clamp(out.skuExpansionConfidenceMul, 0.86, 1.12);
  out.narrativePatienceMul = clamp(out.narrativePatienceMul, 0.88, 1.12);
  out.simulationTrustMul = clamp(out.simulationTrustMul, 0.88, 1.1);
  out.routeConfidenceMul = clamp(out.routeConfidenceMul, 0.88, 1.1);
  out.initiativeUrgencyMul = clamp(out.initiativeUrgencyMul, 0.88, 1.1);
  out.signalImportanceMul = clamp(out.signalImportanceMul, 0.9, 1.1);
  out.strategicPressureMul = clamp(out.strategicPressureMul, 0.9, 1.1);
  out.regimeProbabilityMul = clamp(out.regimeProbabilityMul, 0.92, 1.08);
  out.visualResetTimingBias01 = clamp(out.visualResetTimingBias01, 0.35, 0.72);
  return out;
}

export function weightCategoryForLoop(confidence01: number, recurrence: number): MemoryWeightCategory {
  if (recurrence < 2 || confidence01 < 0.22) return "discarded";
  if (confidence01 > 0.72 && recurrence > 10) return "canonical";
  if (confidence01 > 0.48 && recurrence > 4) return "strategic";
  if (recurrence < 5) return "temporary";
  if (confidence01 < 0.38) return "volatile";
  return "strategic";
}
