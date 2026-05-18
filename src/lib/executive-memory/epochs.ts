import type { PulseMemorySample, StrategicEpoch, StrategicEpochKind } from "./types";
import { weightForEpochKind } from "./weighting";

function inferEpochKind(s: PulseMemorySample): StrategicEpochKind {
  const { regime, executiveProfile, temporalPhase, tension01, operationalDrag, riskProductionOverload, seoSaturation, visualFatigue, riskBrandDilution, pressureIndex, launchReadiness, ctrFatigue } = s;
  if (riskProductionOverload > 58 || operationalDrag > 68) return "operational_overload";
  if (regime === "production_load" || executiveProfile === "recovery") return "saturation_recovery";
  if (regime === "saturation" && executiveProfile === "premium_defense") return "premium_defense";
  if (regime === "opportunity" && executiveProfile === "expansion") return "premium_expansion";
  if (executiveProfile === "silent_accumulation") return "silent_accumulation";
  if (seoSaturation > 52 && temporalPhase === "decline") return "seo_depth_cycle";
  if (riskBrandDilution > 54 && tension01 > 0.48) return "narrative_decay";
  if (visualFatigue > 52 && pressureIndex > 52) return "visual_reset";
  if (temporalPhase === "acceleration" && launchReadiness > 62) return "hero_amplification";
  if (visualFatigue > 48 && ctrFatigue > 48) return "motion_rebuild";
  if (regime === "balanced" && tension01 < 0.42) return "balanced_observation";
  return "balanced_observation";
}

function narrativeForKind(kind: StrategicEpochKind): string {
  const map: Record<StrategicEpochKind, string> = {
    premium_expansion: "Расширение премиального поля — давление на чистоту narrative.",
    silent_accumulation: "Тихое накопление силы запуска без шума на маркетплейсе.",
    saturation_recovery: "Выход из насыщения: recovery-контур и снятие перегрева.",
    seo_depth_cycle: "Глубинный SEO-цикл — плотность сигналов и риск однообразия.",
    narrative_decay: "Дрейф narrative — бренд и hero расходятся с тактикой канала.",
    hero_amplification: "Усиление hero-линии — фокус на визуальном якоре.",
    motion_rebuild: "Пересборка motion-слоя после fatigue — восстановление CTR.",
    operational_overload: "Операционный перегруз — параллельные волны давят на производство.",
    premium_defense: "Premium defense — удержание цены и доверия под атакой шума.",
    visual_reset: "Визуальный reset — снятие fatigue и обновление премиальной сетки.",
    balanced_observation: "Наблюдение в балансе — память фиксирует без резких скачков.",
  };
  return map[kind];
}

function summaryForEpoch(kind: StrategicEpochKind, s: PulseMemorySample): string {
  return `${narrativeForKind(kind)} Пульс ${s.pulse}: напряжение ${Math.round(s.tension01 * 100)}%, готовность ${s.launchReadiness}%, drag ${Math.round(s.operationalDrag)}%.`;
}

export function openEpochFromSample(s: PulseMemorySample, id: string): StrategicEpoch {
  const kind = inferEpochKind(s);
  const stress01 = Math.min(1, s.operationalDrag / 100 + s.riskProductionOverload / 200);
  return {
    id,
    kind,
    startPulse: s.pulse,
    endPulse: null,
    dominantRegime: s.regime,
    executiveProfile: s.executiveProfile,
    strategicTension01: s.tension01,
    narrativeStateRu: narrativeForKind(kind),
    premiumPerceptionDelta01: (s.pressureIndex / 100 - 0.45) * 0.5,
    operationalStress01: stress01,
    memoryWeight: weightForEpochKind(kind, stress01),
    keyInitiativesRu: s.initiativeLabelsRu.slice(0, 6),
    linkedSimulationsRu: [`Горизонт симуляции: ${s.simHorizonId}`],
    linkedLaunchesRu: [`Готовность запуска ${s.launchReadiness}%`],
    executiveSummaryRu: summaryForEpoch(kind, s),
  };
}

export function closeEpoch(e: StrategicEpoch, endPulse: number, s: PulseMemorySample): StrategicEpoch {
  return {
    ...e,
    endPulse,
    strategicTension01: (e.strategicTension01 + s.tension01) / 2,
    executiveSummaryRu: `${e.executiveSummaryRu} Завершение на пульсе ${endPulse}.`,
  };
}

export function shouldStartNewEpoch(prev: PulseMemorySample | undefined, s: PulseMemorySample): boolean {
  if (!prev) return true;
  return prev.regime !== s.regime || prev.executiveProfile !== s.executiveProfile || inferEpochKind(prev) !== inferEpochKind(s);
}

export function trimEpochs(epochs: StrategicEpoch[], max = 24): StrategicEpoch[] {
  if (epochs.length <= max) return epochs;
  return epochs.slice(epochs.length - max);
}
