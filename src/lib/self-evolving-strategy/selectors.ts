import type { ExecutiveLearningLoop, SelfEvolvingSnapshot } from "./types";

export function selectStrongestLoops(snap: SelfEvolvingSnapshot, limit = 5): ExecutiveLearningLoop[] {
  return [...snap.loops].filter((l) => l.recurrence > 0).sort((a, b) => b.leverage01 - a.leverage01).slice(0, limit);
}

export function selectDegradedLoops(snap: SelfEvolvingSnapshot): ExecutiveLearningLoop[] {
  return snap.loops.filter((l) => ["parallel_launches_drag", "aggressive_seo_weakens_narrative", "oversized_fbo_overload_fulfillment"].includes(l.id) && l.leverage01 > 0.5);
}

export function selectReinforcedLoops(snap: SelfEvolvingSnapshot): ExecutiveLearningLoop[] {
  return snap.loops.filter((l) =>
    ["premium_capsules_recover_coherence", "low_sku_launches_stabilize_ops", "synchronized_reels_recovery"].includes(l.id),
  ).filter((l) => l.confidence01 > 0.42);
}

export function evolutionTrendLabelRu(snap: SelfEvolvingSnapshot): string {
  const tr = snap.trajectory;
  if (tr.length < 4) return "Накопление данных — тренд зрелости нейтрален.";
  const a = tr[tr.length - 4]!;
  const b = tr[tr.length - 1]!;
  const d = b.adaptationQuality01 - a.adaptationQuality01;
  if (d > 0.035) return "Организм эволюционирует: качество адаптации растёт.";
  if (d < -0.04) return "Сигнал осторожности: качество адаптации проседает — контур сдерживает импульсы.";
  return "Плато: зрелость держится без резкого дрейфа.";
}
