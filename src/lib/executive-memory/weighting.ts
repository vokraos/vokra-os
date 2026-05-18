import type { MemoryWeightCategory, StrategicEpochKind } from "./types";

/** Epoch archival weight from kind + stress. */
export function weightForEpochKind(kind: StrategicEpochKind, operationalStress01: number): MemoryWeightCategory {
  if (
    kind === "operational_overload" ||
    kind === "saturation_recovery" ||
    kind === "motion_rebuild" ||
    (kind === "premium_defense" && operationalStress01 > 0.55)
  ) {
    return operationalStress01 > 0.68 ? "canonical" : "strategic";
  }
  if (kind === "silent_accumulation" || kind === "balanced_observation") return "strategic";
  if (kind === "narrative_decay" || kind === "visual_reset") return operationalStress01 > 0.62 ? "strategic" : "temporary";
  if (kind === "hero_amplification" || kind === "seo_depth_cycle") return "volatile";
  return "strategic";
}

export function weightForPattern(recurrence: number, confidence01: number): MemoryWeightCategory {
  if (recurrence >= 8 && confidence01 >= 0.55) return "canonical";
  if (recurrence >= 4 && confidence01 >= 0.42) return "strategic";
  if (recurrence >= 2) return "temporary";
  if (confidence01 < 0.22 && recurrence < 3) return "discarded";
  return "volatile";
}

export function decayVolatileWeight(category: MemoryWeightCategory, pulsesSince: number): MemoryWeightCategory {
  if (category !== "volatile") return category;
  if (pulsesSince > 120) return "discarded";
  if (pulsesSince > 40) return "temporary";
  return "volatile";
}
