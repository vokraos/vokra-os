import type { SelfEvolvingSyncAdjustments } from "./types";
import { loadPersistedSelfEvolvingStrategy } from "./persistence";
import { clamp } from "../math";

/** Read last persisted evolution — safe defaults when empty or parse fails. */
export function readSelfEvolvingSyncAdjustments(): SelfEvolvingSyncAdjustments {
  const s = loadPersistedSelfEvolvingStrategy();
  const w = s.weights;
  const parallel = s.loops.parallel_launches_drag?.leverage01 ?? 0;
  const seo = s.loops.aggressive_seo_weakens_narrative?.leverage01 ?? 0;
  const fbo = s.loops.oversized_fbo_overload_fulfillment?.leverage01 ?? 0;
  const calm = (s.loops.premium_capsules_recover_coherence?.confidence01 ?? 0) + (s.loops.low_sku_launches_stabilize_ops?.confidence01 ?? 0);

  return {
    initiativeLeverageBias: clamp((parallel - 0.45) * 8 - (w.initiativeUrgencyMul - 1) * 40, -6, 6),
    seoLeverageMul: clamp(w.seoAggressivenessMul, 0.88, 1.12),
    productionLeverageMul: clamp(1 + (fbo - 0.45) * 0.15 - (w.overloadToleranceMul - 1), 0.88, 1.12),
    simulationVolatilityBias: clamp((1 - w.simulationTrustMul) * 12 + seo * 4, -10, 10),
    executionConfidenceBias: clamp((w.routeConfidenceMul - 1) * 14 + calm * 3, -8, 10),
    organismStressBias: clamp((1 - w.overloadToleranceMul) * 10 + parallel * 5, -8, 10),
    liveTensionDelta: clamp((w.strategicPressureMul - 1) * 0.035 + parallel * 0.02, -0.055, 0.055),
    liveConfidenceDelta: clamp((w.routeConfidenceMul - 1) * 0.04 + calm * 0.015, -0.045, 0.045),
    liveStabilityDelta: clamp((w.narrativePatienceMul - 1) * 0.038 + (w.premiumDefenseSensitivityMul - 1) * 0.022, -0.045, 0.045),
    stripRu:
      s.lastIngestPulse > 0
        ? `Самоэволюция: SEO×${w.seoAggressivenessMul.toFixed(2)} · overload tolerance×${w.overloadToleranceMul.toFixed(2)} · narrative patience×${w.narrativePatienceMul.toFixed(2)}.`
        : null,
  };
}
