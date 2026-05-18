import type { ExecutiveRegimeProfile } from "../live-state/types";
import type { InitiativeUrgency } from "../initiative-engine/types";
import type { MarketRegime } from "../cognitive-os/types";
import type {
  CanonicalMemoryItem,
  ExecutiveMemoryHints,
  ExecutiveMemorySnapshot,
  ExecutivePattern,
  ExecutivePatternId,
  LaunchMistake,
  PersistedExecutiveMemoryState,
  PulseMemorySample,
  RecoveryLandmark,
  StrategicScar,
  StrategicEpochKind,
  IngestWorldPulse,
} from "./types";
import { toHistoricalDriftState } from "./drift";
import { weightForPattern } from "./weighting";
import { clamp } from "../math";

const PATTERN_LABELS: Record<ExecutivePatternId, string> = {
  premium_launch_stability: "Премиальные запуски стабилизируются медленнее, но держат дольше.",
  motion_recovery_ctr: "Motion-first recovery улучшает CTR после fatigue-слоя.",
  parallel_initiative_dilution: "Параллельные инициативы повышают риск размытия бренда.",
  aggressive_seo_hero_drift: "Агрессивное SEO-расширение ослабляет hero-согласованность.",
  execution_wave_overload: "Крупные волны исполнения перегружают производство.",
  reels_hero_sync_recovery: "Синхронные Reels + hero-обновление улучшают recovery.",
};

function mapExecutiveProfile(regime: MarketRegime, pressure: number, urgency: InitiativeUrgency, launchReadiness: number): ExecutiveRegimeProfile {
  if (regime === "opportunity") return "expansion";
  if (regime === "production_load") return "recovery";
  if (regime === "saturation") return pressure > 58 ? "recovery" : "premium_defense";
  if (urgency === "critical") return "recovery";
  if (pressure < 44 && urgency === "calm" && launchReadiness > 62) return "silent_accumulation";
  return "observation";
}

export function computeTension01(w: IngestWorldPulse): number {
  const { synthesis, decision, fabricConflictCount } = w;
  const riskAvg =
    (decision.riskCtrFatigue + decision.riskBrandDilution + decision.riskSaturationProb + decision.riskProductionOverload) / 400;
  const pNorm = synthesis.pressureIndex / 100;
  return clamp(pNorm * 0.45 + riskAvg * 0.55 + fabricConflictCount * 0.02, 0, 1);
}

export function buildIngestWorldPulse(
  base: Omit<IngestWorldPulse, "executiveProfile" | "tension01"> & Partial<Pick<IngestWorldPulse, "tension01" | "executiveProfile">>,
): IngestWorldPulse {
  const profile =
    base.executiveProfile ??
    mapExecutiveProfile(base.regime, base.synthesis.pressureIndex, base.initiativeUrgency, base.synthesis.launchReadiness);
  const tension01 = base.tension01 ?? computeTension01({ ...base, executiveProfile: profile, tension01: 0 });
  return { ...base, executiveProfile: profile, tension01 };
}

export function worldPulseToSample(w: IngestWorldPulse): PulseMemorySample {
  return {
    pulse: w.pulseGeneration,
    regime: w.regime,
    executiveProfile: w.executiveProfile,
    tension01: w.tension01,
    pressureIndex: w.synthesis.pressureIndex,
    operationalDrag: w.orchestration.operationalDrag,
    executionConfidence: w.orchestration.executionConfidence,
    ctrFatigue: w.temporal.decay.ctrFatigue,
    visualFatigue: w.temporal.decay.visualFatigue,
    seoSaturation: w.temporal.decay.seoSaturation,
    riskBrandDilution: w.decision.riskBrandDilution,
    riskProductionOverload: w.decision.riskProductionOverload,
    initiativeCount: w.initiatives.count,
    fabricConflictCount: w.fabricConflictCount,
    temporalPhase: w.temporal.phase,
    launchReadiness: w.synthesis.launchReadiness,
    memoryGenerationCount: w.memoryGenerationCount,
    organismOperationalStress: w.organism.operationalStress,
    organismNarrativeCoherence: w.organism.narrativeCoherence,
    predictiveVolatility01: w.predictive ? w.predictive.volatilityIndex / 100 : 0.45,
    simHorizonId: w.simHorizonId,
    initiativeLabelsRu: w.initiatives.topLabelsRu,
  };
}

function patternsFromState(state: PersistedExecutiveMemoryState): ExecutivePattern[] {
  const ids = Object.keys(state.patternStats) as ExecutivePatternId[];
  return ids
    .map((id) => {
      const st = state.patternStats[id];
      if (!st) return null;
      const recurrence = st.hits;
      const historicalLeverage01 = st.leverageEMA;
      const confidence01 = clamp((Math.log1p(recurrence) / Math.log1p(24)) * historicalLeverage01, 0, 1);
      const weightCategory = weightForPattern(recurrence, confidence01);
      return {
        id,
        labelRu: PATTERN_LABELS[id],
        confidence01,
        recurrence,
        historicalLeverage01,
        weightCategory,
      };
    })
    .filter((x): x is ExecutivePattern => Boolean(x))
    .sort((a, b) => b.historicalLeverage01 - a.historicalLeverage01);
}

function canonicalFromEpochs(state: PersistedExecutiveMemoryState): CanonicalMemoryItem[] {
  return state.epochs
    .filter((e) => e.memoryWeight === "canonical" || e.memoryWeight === "strategic")
    .slice(-8)
    .reverse()
    .map((e, i) => ({
      id: `can-${e.id}-${i}`,
      titleRu: `${e.kind.replace(/_/g, " ")} · пульсы ${e.startPulse}–${e.endPulse ?? "…"}`,
      bodyRu: e.executiveSummaryRu,
      weight: e.memoryWeight,
      anchoredPulse: e.startPulse,
    }));
}

function scarsFromEpochs(state: PersistedExecutiveMemoryState): StrategicScar[] {
  const overloads = state.epochs.filter((e) => e.kind === "operational_overload" || e.kind === "narrative_decay");
  return overloads.slice(-5).map((e, i) => ({
    id: `scar-${e.id}-${i}`,
    labelRu: e.narrativeStateRu,
    severity01: clamp(e.operationalStress01 * 0.55 + e.strategicTension01 * 0.45, 0, 1),
    originEpochKind: e.kind as StrategicEpochKind,
    lessonRu: "Память держит шрам как якорь — не повторять ту же волну давления без recovery-буфера.",
  }));
}

function recoveriesFromEpochs(state: PersistedExecutiveMemoryState): RecoveryLandmark[] {
  return state.epochs
    .filter((e) => e.kind === "saturation_recovery" && e.endPulse != null)
    .slice(-6)
    .map((e, i) => ({
      id: `rec-${e.id}-${i}`,
      labelRu: "Фаза восстановления зафиксирована",
      pulse: e.endPulse ?? e.startPulse,
      deltaTension01: 0.08,
      noteRu: e.executiveSummaryRu,
    }));
}

function launchMistakesFromPatterns(patterns: ExecutivePattern[], state: PersistedExecutiveMemoryState): LaunchMistake[] {
  return patterns
    .filter((p) => p.id === "parallel_initiative_dilution" || p.id === "execution_wave_overload")
    .map((p) => ({
      id: `lm-${p.id}`,
      pattern: p.id,
      labelRu: p.labelRu,
      recurrence: p.recurrence,
      lastPulse: state.patternStats[p.id]?.lastPulse ?? 0,
    }));
}

function pressureMapFromSamples(state: PersistedExecutiveMemoryState): { labelRu: string; value01: number }[] {
  if (state.samples.length < 3) {
    return [
      { labelRu: "Сбор истории", value01: 0.25 },
      { labelRu: "Давление контура", value01: 0.35 },
      { labelRu: "Исполнение", value01: 0.3 },
    ];
  }
  const tail = state.samples.slice(-40);
  const avgP = tail.reduce((s, x) => s + x.pressureIndex, 0) / tail.length / 100;
  const avgDrag = tail.reduce((s, x) => s + x.operationalDrag, 0) / tail.length / 100;
  const avgTen = tail.reduce((s, x) => s + x.tension01, 0) / tail.length;
  return [
    { labelRu: "Историческое давление рынка", value01: clamp(avgP, 0, 1) },
    { labelRu: "Накопленный operational drag", value01: clamp(avgDrag, 0, 1) },
    { labelRu: "Стратегическое напряжение (среднее)", value01: clamp(avgTen, 0, 1) },
  ];
}

export function buildLiveCognitionHints(snapshot: ExecutiveMemorySnapshot): ExecutiveMemoryHints {
  const d = snapshot.drift;
  let tensionBias = (d.executiveFragmentation01 - 0.42) * 0.05 + (d.premiumPerceptionErosion01 - 0.42) * 0.035;
  let confidenceBias = (snapshot.longTermCoherence01 - 0.5) * 0.08;
  let stabilityBias = (0.48 - d.operationalDragAcc01) * 0.06;
  if (snapshot.drift.detection === "recovery_cycle") {
    tensionBias -= 0.025;
    confidenceBias += 0.04;
    stabilityBias += 0.035;
  }
  if (snapshot.drift.detection === "slow_degradation") {
    tensionBias += 0.035;
    confidenceBias -= 0.03;
  }
  const initiativeWeightMul = clamp(1 + (d.executiveFragmentation01 - 0.45) * 0.12, 0.94, 1.08);
  const simulationProbBias = clamp(
    (d.seoSaturationGrowth01 - 0.4) * 0.04 + snapshot.patterns.filter((p) => p.id === "aggressive_seo_hero_drift").length * 0.02,
    -0.06,
    0.06,
  );
  const stripEchoRu =
    snapshot.persistedSampleCount > 8
      ? `Память: ${snapshot.drift.detection === "recovery_cycle" ? "контур выходил на recovery" : "дрейф под контролем дисциплины"}.`
      : null;
  return {
    tensionBias: clamp(tensionBias, -0.08, 0.08),
    confidenceBias: clamp(confidenceBias, -0.06, 0.06),
    stabilityBias: clamp(stabilityBias, -0.06, 0.06),
    simulationProbBias,
    initiativeWeightMul,
    stripEchoRu,
  };
}

export function buildExecutiveMemorySnapshot(state: PersistedExecutiveMemoryState, pulseGeneration: number): ExecutiveMemorySnapshot {
  const last = state.samples.length ? state.samples[state.samples.length - 1]! : undefined;
  const narrativeStateRu = last
    ? `Пульс ${pulseGeneration}: режим ${last.regime}, профиль ${last.executiveProfile}, напряжение ${Math.round(last.tension01 * 100)}%.`
    : "Историческая память инициализируется — контур накапливает первые эпохи.";

  const patterns = patternsFromState(state);
  const gap = Math.max(0, pulseGeneration - state.lastRecoveryPulse);
  const drift = toHistoricalDriftState(state.drift, gap);
  const canonicalMemories = canonicalFromEpochs(state);
  const strategicScars = scarsFromEpochs(state);
  const recoveredStates = recoveriesFromEpochs(state);
  const launchMistakes = launchMistakesFromPatterns(patterns, state);
  const historicalPressureMap = pressureMapFromSamples(state);
  const longTermCoherence01 = clamp(
    (last?.organismNarrativeCoherence ?? 68) / 100 + (last?.executionConfidence ?? 70) / 300 - drift.narrativeDilution01 * 0.25,
    0,
    1,
  );
  const strongestRecoveriesRu = recoveredStates.map((r) => r.noteRu.slice(0, 120)).filter(Boolean);
  const executiveSummaryRu = `Стратегическая память держит ${state.epochs.length} эпох, ${patterns.length} усиленных паттернов и ${state.samples.length} пульсов выборки. ${drift.captionRu}`;

  const base: ExecutiveMemorySnapshot = {
    pulseGeneration,
    persistedSampleCount: state.samples.length,
    projectMemoryInfluenceCount: last?.memoryGenerationCount ?? 0,
    narrativeStateRu,
    epochs: state.epochs,
    patterns,
    drift,
    canonicalMemories,
    strategicScars,
    recoveredStates,
    launchMistakes,
    historicalPressureMap,
    longTermCoherence01,
    strongestRecoveriesRu,
    executiveSummaryRu,
    hints: {
      tensionBias: 0,
      confidenceBias: 0,
      stabilityBias: 0,
      simulationProbBias: 0,
      initiativeWeightMul: 1,
      stripEchoRu: null,
    },
  };
  return { ...base, hints: buildLiveCognitionHints(base) };
}
