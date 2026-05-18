import type { ExecutiveLearningLoopId, IngestSelfEvolvingWorld, PersistedSelfEvolvingState } from "./types";
import { mergeLoopState } from "./confidence";

const LABELS: Record<ExecutiveLearningLoopId, string> = {
  premium_capsules_recover_coherence: "Премиальные капсулы восстанавливают narrative-связность.",
  low_sku_launches_stabilize_ops: "Низко-SKU запуски стабилизируют операционный контур.",
  synchronized_reels_recovery: "Синхронные Reels усиливают recovery после fatigue.",
  parallel_launches_drag: "Параллельные запуски наращивают operational drag.",
  aggressive_seo_weakens_narrative: "Агрессивное SEO ослабляет narrative-целостность.",
  oversized_fbo_overload_fulfillment: "Перегруженные FBO-волны давят на fulfillment.",
};

export function loopLabelRu(id: ExecutiveLearningLoopId): string {
  return LABELS[id];
}

function hasPat(emIds: readonly string[], needle: string): boolean {
  return emIds.some((x) => x === needle);
}

/** Map contour + executive memory patterns into loop reinforcement. */
export function applyLoopHeuristics(prev: PersistedSelfEvolvingState, w: IngestSelfEvolvingWorld): PersistedSelfEvolvingState["loops"] {
  let loops = { ...prev.loops };
  const em = w.emPatternIds;

  if (w.narrativeCoherencePct > 62 && w.tension01 < 0.48) {
    loops = mergeLoopState(loops, "premium_capsules_recover_coherence", {
      leverageSignal: 0.55,
      stabilitySignal: 0.06,
      impactSignal: 0.5,
    });
  }

  if (w.initiativeCount <= 3 && w.operationalDrag < 58) {
    loops = mergeLoopState(loops, "low_sku_launches_stabilize_ops", {
      leverageSignal: 0.48,
      stabilitySignal: 0.08,
      impactSignal: 0.42,
    });
  }

  if (hasPat(em, "reels_hero_sync_recovery") || (w.launchReadiness > 64 && w.fabricConflictCount === 0)) {
    loops = mergeLoopState(loops, "synchronized_reels_recovery", {
      leverageSignal: 0.52,
      stabilitySignal: 0.05,
      impactSignal: 0.48,
    });
  }

  if (w.initiativeCount >= 5 || hasPat(em, "parallel_initiative_dilution")) {
    loops = mergeLoopState(loops, "parallel_launches_drag", {
      leverageSignal: 0.62,
      stabilitySignal: -0.1,
      impactSignal: 0.55,
    });
  }

  if (w.seoSaturation > 54 || hasPat(em, "aggressive_seo_hero_drift") || w.riskBrandDilution > 52) {
    loops = mergeLoopState(loops, "aggressive_seo_weakens_narrative", {
      leverageSignal: 0.58,
      stabilitySignal: -0.07,
      impactSignal: 0.52,
    });
  }

  if (w.riskProductionOverload > 56 || w.operationalDrag > 66) {
    loops = mergeLoopState(loops, "oversized_fbo_overload_fulfillment", {
      leverageSignal: 0.6,
      stabilitySignal: -0.12,
      impactSignal: 0.58,
    });
  }

  return loops;
}

export const ALL_LOOP_IDS: ExecutiveLearningLoopId[] = [
  "premium_capsules_recover_coherence",
  "low_sku_launches_stabilize_ops",
  "synchronized_reels_recovery",
  "parallel_launches_drag",
  "aggressive_seo_weakens_narrative",
  "oversized_fbo_overload_fulfillment",
];
