import type {
  ExecutiveLearningLoop,
  ExecutiveLearningLoopId,
  PersistedSelfEvolvingState,
  SelfEvolvingHints,
  SelfEvolvingSnapshot,
} from "./types";
import { ALL_LOOP_IDS, loopLabelRu } from "./loops";
import { ensureLoopSeeds } from "./persistence";
import { clamp } from "../math";

function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

function toLoop(id: ExecutiveLearningLoopId, st: NonNullable<PersistedSelfEvolvingState["loops"][typeof id]>): ExecutiveLearningLoop {
  return {
    id,
    labelRu: loopLabelRu(id),
    recurrence: st.recurrence,
    confidence01: st.confidence01,
    leverage01: st.leverage01,
    strategicImpact01: st.strategicImpact01,
    stabilityDeltaSigned: st.stabilityDeltaSigned,
    memoryWeight: st.memoryWeight,
  };
}

function maturityFromTrajectory(tr: readonly { adaptationQuality01: number; strategicMaturity01: number }[]): number {
  if (!tr.length) return 0.42;
  const tail = tr.slice(-12);
  const m = tail.reduce((s, p) => s + p.adaptationQuality01 * 0.55 + p.strategicMaturity01 * 0.45, 0) / tail.length;
  return clamp01(m);
}

function adaptationPressure(state: PersistedSelfEvolvingState): number {
  const w = state.weights;
  const spread =
    Math.abs(w.seoAggressivenessMul - 1) +
    Math.abs(w.overloadToleranceMul - 1) +
    Math.abs(w.initiativeUrgencyMul - 1) +
    Math.abs(w.strategicPressureMul - 1);
  return clamp01(spread * 0.35 + (state.trajectory.length ? state.trajectory[state.trajectory.length - 1]!.overloadSensitivity01 * 0.35 : 0.2));
}

export function buildSelfEvolvingHints(snapshot: SelfEvolvingSnapshot): SelfEvolvingHints {
  const w = snapshot.weights;
  let tensionDelta = (w.strategicPressureMul - 1) * 0.04 + (1 - w.overloadToleranceMul) * 0.03;
  let confidenceDelta = (w.routeConfidenceMul - 1) * 0.05 + (w.simulationTrustMul - 1) * 0.03;
  let stabilityDelta = (w.narrativePatienceMul - 1) * 0.04 + (w.premiumDefenseSensitivityMul - 1) * 0.025;
  tensionDelta = clamp(tensionDelta, -0.06, 0.06);
  confidenceDelta = clamp(confidenceDelta, -0.05, 0.05);
  stabilityDelta = clamp(stabilityDelta, -0.05, 0.05);
  const stripRu =
    snapshot.pulseGeneration > 2
      ? `Эволюция стратегии: зрелость ${Math.round(snapshot.maturity01 * 100)}% · давление адаптации ${Math.round(snapshot.adaptationPressure01 * 100)}%.`
      : null;
  return { tensionDelta, confidenceDelta, stabilityDelta, stripRu };
}

export function buildSelfEvolvingSnapshot(state: PersistedSelfEvolvingState, pulseGeneration: number): SelfEvolvingSnapshot {
  const loopsFull = ensureLoopSeeds(state);
  const merged: PersistedSelfEvolvingState = { ...state, loops: loopsFull };
  const loops: ExecutiveLearningLoop[] = ALL_LOOP_IDS.map((id) => toLoop(id, merged.loops[id]!)).sort((a, b) => b.leverage01 - a.leverage01);

  const keys = Object.keys(merged.weights) as (keyof typeof merged.weights)[];
  const weightDeltas: SelfEvolvingSnapshot["weightDeltas"] = {};
  for (const k of keys) {
    weightDeltas[k] = merged.weights[k] - 1;
  }

  const last = merged.trajectory.length ? merged.trajectory[merged.trajectory.length - 1]! : null;
  const maturity01 = maturityFromTrajectory(merged.trajectory);
  const adaptationPressure01 = adaptationPressure(merged);

  const degradedStrategyLabelsRu = loops
    .filter((l) => l.id === "parallel_launches_drag" || l.id === "aggressive_seo_weakens_narrative" || l.id === "oversized_fbo_overload_fulfillment")
    .filter((l) => l.leverage01 > 0.52 && l.confidence01 > 0.38)
    .map((l) => l.labelRu);

  const reinforcedStructureLabelsRu = loops
    .filter((l) => l.id === "premium_capsules_recover_coherence" || l.id === "low_sku_launches_stabilize_ops" || l.id === "synchronized_reels_recovery")
    .filter((l) => l.leverage01 > 0.48 && l.stabilityDeltaSigned > -0.02)
    .map((l) => l.labelRu);

  const recoveredSystemsRu =
    last && last.executionResilience01 > 0.58
      ? ["Исполнительный контур: resilience выше базовой — recovery-структуры закрепляются."]
      : ["Контур в фазе накопления сигналов для подтверждённого recovery."];

  const unstableBehaviorsRu = loops
    .filter((l) => l.stabilityDeltaSigned < -0.04 && l.recurrence > 2)
    .slice(0, 4)
    .map((l) => `${l.labelRu} (×${l.recurrence})`);

  const futureVectorsRu = [
    `SEO-агрессия ×${merged.weights.seoAggressivenessMul.toFixed(2)} — ${merged.weights.seoAggressivenessMul < 0.98 ? "сдерживание long-tail расширения" : "нейтральный коридор"}.`,
    `Premium defense чувствительность ×${merged.weights.premiumDefenseSensitivityMul.toFixed(2)}.`,
    `Терпение narrative ×${merged.weights.narrativePatienceMul.toFixed(2)} · визуальный reset bias ${Math.round(merged.weights.visualResetTimingBias01 * 100)}%.`,
  ];

  const evolvingConfidence01 = clamp01(
    maturity01 * 0.45 + merged.weights.simulationTrustMul * 0.2 + merged.weights.routeConfidenceMul * 0.2 + (1 - adaptationPressure01) * 0.15,
  );

  const summaryRu = `Самоэволюция стратегии: ${loops.filter((l) => l.recurrence > 0).length} активных контуров обучения, зрелость ${Math.round(maturity01 * 100)}%. Веса дрейфуют медленно — без резких скачков.`;

  const base: SelfEvolvingSnapshot = {
    pulseGeneration,
    weights: merged.weights,
    weightDeltas,
    loops,
    trajectory: merged.trajectory,
    maturity01,
    adaptationPressure01,
    degradedStrategyLabelsRu,
    reinforcedStructureLabelsRu,
    recoveredSystemsRu,
    unstableBehaviorsRu,
    futureVectorsRu,
    evolvingConfidence01,
    summaryRu,
    hints: {
      tensionDelta: 0,
      confidenceDelta: 0,
      stabilityDelta: 0,
      stripRu: null,
    },
  };
  return { ...base, hints: buildSelfEvolvingHints(base) };
}
