import type { AdaptationWeightVector, ExecutiveLearningLoopId, PersistedSelfEvolvingState } from "./types";
import { DEFAULT_WEIGHTS } from "./weighting";
import { clamp } from "../math";

function loopStrength(state: PersistedSelfEvolvingState, id: ExecutiveLearningLoopId): number {
  const L = state.loops[id];
  if (!L) return 0;
  return clamp(L.confidence01 * Math.log1p(L.recurrence) / Math.log1p(20), 0, 1);
}

/** Derive target weights from reinforced / penalized loops — explainable deltas only. */
export function computeAdaptationTargets(state: PersistedSelfEvolvingState): AdaptationWeightVector {
  const t = { ...DEFAULT_WEIGHTS };
  const prem = loopStrength(state, "premium_capsules_recover_coherence");
  const lowSku = loopStrength(state, "low_sku_launches_stabilize_ops");
  const reels = loopStrength(state, "synchronized_reels_recovery");
  const parallel = loopStrength(state, "parallel_launches_drag");
  const seoN = loopStrength(state, "aggressive_seo_weakens_narrative");
  const fbo = loopStrength(state, "oversized_fbo_overload_fulfillment");

  t.premiumDefenseSensitivityMul += prem * 0.06 + reels * 0.03;
  t.narrativePatienceMul += prem * 0.05 + lowSku * 0.04;
  t.skuExpansionConfidenceMul += lowSku * 0.05 - parallel * 0.07;
  t.overloadToleranceMul += lowSku * 0.03 - parallel * 0.08 - fbo * 0.09;
  t.seoAggressivenessMul -= seoN * 0.1;
  t.routeConfidenceMul += lowSku * 0.03 + reels * 0.02 - parallel * 0.05 - fbo * 0.04;
  t.simulationTrustMul += prem * 0.02 + reels * 0.02 - seoN * 0.03;
  t.initiativeUrgencyMul -= parallel * 0.06;
  t.initiativeUrgencyMul += reels * 0.02;
  t.strategicPressureMul += parallel * 0.04 + fbo * 0.05 - prem * 0.03;
  t.signalImportanceMul += prem * 0.02 - seoN * 0.02;
  t.regimeProbabilityMul += prem * 0.015 - parallel * 0.02;
  t.visualResetTimingBias01 += reels * 0.04 + seoN * 0.03 - prem * 0.02;

  return t;
}
