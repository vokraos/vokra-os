import type { SignalFabricSnapshot } from "../signal-fabric/types";
import type { TemporalStrategySnapshot } from "./types";

/** Adjust temporal narrative from live signal fabric (pressure, conflicts, stream head). */
export function applyFabricToTemporal(base: TemporalStrategySnapshot, fabric: SignalFabricSnapshot): TemporalStrategySnapshot {
  const conflictStress =
    fabric.conflicts.reduce((a, c) => a + c.severity, 0) / Math.max(1, fabric.conflicts.length);
  const patienceDelta = Math.round(conflictStress * 0.12 + fabric.pressures.execution * 0.08);
  const fatigueExtra = Math.round(fabric.pressures.production * 0.15 + fabric.pressures.market * 0.08);
  const head = fabric.stream[0];
  const nextRisk =
    head?.urgency === "critical"
      ? `${base.nextRiskWindowRu} Каскадный риск: усиление по сигнальной ткани («${head.labelRu}»).`
      : base.nextRiskWindowRu;

  return {
    ...base,
    patienceScore: Math.max(18, base.patienceScore - patienceDelta),
    fatigueForecastRu: `${base.fatigueForecastRu} Сигнальная сеть: +перегрев ${fatigueExtra}% (модель контура).`,
    nextRiskWindowRu: nextRisk,
  };
}
