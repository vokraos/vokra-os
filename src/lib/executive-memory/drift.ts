import type { DriftAccumulator, DriftDetection, HistoricalDriftState, PulseMemorySample } from "./types";

const α = 0.08;

function ema(prev: number, next: number): number {
  return prev * (1 - α) + next * α;
}

export function initialDrift(): DriftAccumulator {
  return {
    brandDnaDrift01: 0.12,
    narrativeDilution01: 0.14,
    executiveFragmentation01: 0.1,
    operationalDragAcc01: 0.12,
    seoSaturationGrowth01: 0.1,
    visualFatigueAcc01: 0.11,
    premiumPerceptionErosion01: 0.09,
  };
}

export function advanceDrift(prev: DriftAccumulator, s: PulseMemorySample): DriftAccumulator {
  const frag = Math.min(1, s.initiativeCount / 10) * (s.riskBrandDilution / 100) * 0.9 + (s.fabricConflictCount > 0 ? 0.06 : 0);
  const brand = s.riskBrandDilution / 100;
  const narrative = (s.riskBrandDilution * 0.45 + (100 - s.launchReadiness) * 0.55) / 100;
  const drag = s.operationalDrag / 100;
  const seo = s.seoSaturation / 100;
  const visual = s.visualFatigue / 100;
  const premium = (s.pressureIndex / 100) * 0.35 + (1 - s.executionConfidence / 100) * 0.35 + (s.ctrFatigue / 100) * 0.3;

  return {
    brandDnaDrift01: ema(prev.brandDnaDrift01, brand),
    narrativeDilution01: ema(prev.narrativeDilution01, narrative),
    executiveFragmentation01: ema(prev.executiveFragmentation01, frag),
    operationalDragAcc01: ema(prev.operationalDragAcc01, drag),
    seoSaturationGrowth01: ema(prev.seoSaturationGrowth01, seo),
    visualFatigueAcc01: ema(prev.visualFatigueAcc01, visual),
    premiumPerceptionErosion01: ema(prev.premiumPerceptionErosion01, premium),
  };
}

export function detectDriftMode(d: DriftAccumulator, lastRecoveryPulseGap: number): { detection: DriftDetection; captionRu: string } {
  const stress = (d.executiveFragmentation01 + d.operationalDragAcc01 + d.narrativeDilution01) / 3;
  if (stress > 0.58 && d.premiumPerceptionErosion01 > 0.52) {
    return {
      detection: "slow_degradation",
      captionRu: "Медленная эрозия премиального контура: накопленный drift в narrative и operational drag.",
    };
  }
  if (d.executiveFragmentation01 > 0.55 && lastRecoveryPulseGap < 40) {
    return {
      detection: "recurring_instability",
      captionRu: "Повторяющаяся нестабильность исполнения — фрагментация инициатив и конфликты ткани близко по пульсу.",
    };
  }
  if (d.operationalDragAcc01 < 0.38 && d.narrativeDilution01 < 0.42 && d.premiumPerceptionErosion01 < 0.45) {
    return {
      detection: "recovery_cycle",
      captionRu: "Фаза recovery: drag и dilution сжимаются, память усиливает доверие к стабилизирующим структурам.",
    };
  }
  return {
    detection: "stable",
    captionRu: "Дрейф умеренный — контур в пределах дисциплины; память не поднимает тревогу.",
  };
}

export function toHistoricalDriftState(d: DriftAccumulator, lastRecoveryPulseGap: number): HistoricalDriftState {
  const { detection, captionRu } = detectDriftMode(d, lastRecoveryPulseGap);
  return { ...d, detection, captionRu };
}
