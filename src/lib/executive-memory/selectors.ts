import type { ExecutiveMemorySnapshot, StrategicEpoch, ExecutivePattern } from "./types";

export function selectRecentEpochs(snapshot: ExecutiveMemorySnapshot, limit = 12): readonly StrategicEpoch[] {
  return snapshot.epochs.slice(-limit);
}

export function selectTopPatterns(snapshot: ExecutiveMemorySnapshot, limit = 8): readonly ExecutivePattern[] {
  return snapshot.patterns.slice(0, limit);
}

export function selectOpenEpoch(snapshot: ExecutiveMemorySnapshot): StrategicEpoch | null {
  const open = snapshot.epochs.filter((e) => e.endPulse == null);
  return open.length ? open[open.length - 1]! : null;
}

export function selectCoherenceLabel(snapshot: ExecutiveMemorySnapshot): string {
  const c = snapshot.longTermCoherence01;
  if (c > 0.72) return "Высокая долгосрочная согласованность";
  if (c > 0.52) return "Умеренная согласованность — память стабилизирует";
  return "Согласованность под давлением — память усиливает осторожность";
}
