import type { NavId } from "../../types";
import type { MarketRegime, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import { COGNITIVE_NETWORK_IDS } from "../cognitive-os/types";
import type { InitiativePriority, InitiativeUrgency } from "../initiative-engine/types";
import { PRIORITY_RANK } from "../initiative-engine/types";
import type { TemporalPhase } from "../temporal-strategy/types";
import { TEMPORAL_PHASE_RU } from "../temporal-strategy/types";
import type {
  AttentionShift,
  CognitivePulse,
  ConfidenceDrift,
  ExecutiveBreath,
  ExecutiveRegimeProfile,
  LiveShellCssVars,
  LiveState,
  ModuleLiveActivity,
  PressureWave,
  RegimeTransition,
  StabilityFlow,
  StrategicTension,
  SystemRhythm,
} from "./types";
import {
  globalMarketPulseMessageKey,
  marketWeather3FromSignals,
  marketWeatherFromSignals,
  organismShellMultipliers,
  weather3ShellScalars,
} from "../cognitive-depth/strategic-organism";
import { clamp, clip, hashStr } from "../math";

export function deriveModuleLiveActivity(id: NavId, m: ModuleCognitiveSnapshot | undefined): ModuleLiveActivity {
  const snap: ModuleCognitiveSnapshot = m ?? {
    activity: "steady",
    signalHealth: 60,
    sync: "synced",
    pressure: 40,
    confidence: 64,
    incomingRu: null,
    outgoingRu: null,
    brandGate: "ok",
  };
  if (snap.pressure > 72 || (snap.activity === "priority" && snap.pressure > 62)) return "overloaded";
  if (snap.sync === "catchup" && snap.pressure > 54) return "blocked";
  if (snap.sync === "drift") return "learning";
  if (id === "feedbackLoop" && snap.confidence > 74 && snap.pressure < 58) return "learning";
  if (snap.activity === "active" || snap.activity === "sync") return "active";
  if (snap.pressure < 36 && snap.activity === "steady") return "dormant";
  return "stable";
}

function mapExecutiveProfile(
  regime: MarketRegime,
  pressure: number,
  urgency: InitiativeUrgency,
  launchReadiness: number,
): ExecutiveRegimeProfile {
  if (regime === "opportunity") return "expansion";
  if (regime === "production_load") return "recovery";
  if (regime === "saturation") return pressure > 58 ? "recovery" : "premium_defense";
  if (urgency === "critical") return "recovery";
  if (pressure < 44 && urgency === "calm" && launchReadiness > 62) return "silent_accumulation";
  return "observation";
}

export type BuildLiveStateInput = {
  pulseGeneration: number;
  regime: MarketRegime;
  synthesis: {
    pressureIndex: number;
    launchReadiness: number;
    memoryEchoRu: string;
    topOpportunityRu: string;
  };
  decision: {
    riskCtrFatigue: number;
    riskBrandDilution: number;
    riskSaturationProb: number;
    riskProductionOverload: number;
    priorityHeadlineRu: string;
  };
  initiatives: { priorities: readonly InitiativePriority[] };
  initiativeUrgency: InitiativeUrgency;
  orchestration: {
    executionConfidence: number;
    operationalDrag: number;
    resourcePressure: { dtfQueue: number; contentLoad: number; fboReadiness: number };
  };
  temporal: {
    phase: TemporalPhase;
    bestLaunchWindowRu: string;
    decay: { ctrFatigue: number; visualFatigue: number; seoSaturation: number };
    patienceScore: number;
  };
  predictive: { decayPressure: number; volatilityIndex: number } | null;
  fabric: { edgeCount: number; avgIntensity: number; conflictCount: number } | null;
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  executiveMemoryHints?: {
    tensionBias: number;
    confidenceBias: number;
    stabilityBias: number;
    stripEchoRu: string | null;
  } | null;
  selfEvolvingHints?: {
    tensionDelta: number;
    confidenceDelta: number;
    stabilityDelta: number;
    stripRu: string | null;
  } | null;
};

export function buildLiveState(input: BuildLiveStateInput): {
  live: LiveState;
  cssVars: LiveShellCssVars;
  moduleActivity: (id: NavId) => ModuleLiveActivity;
} {
  const { pulseGeneration, regime, synthesis, decision, initiatives, initiativeUrgency, orchestration, temporal, predictive, fabric, modules, executiveMemoryHints, selfEvolvingHints } = input;

  const pNorm = synthesis.pressureIndex / 100;
  const drag = orchestration.operationalDrag / 100;
  const conf = orchestration.executionConfidence / 100;
  const fatigue = clamp((temporal.decay.ctrFatigue + temporal.decay.visualFatigue + temporal.decay.seoSaturation) / 220, 0, 1);
  const vol = predictive ? predictive.volatilityIndex / 100 : 0.45;
  const decayP = predictive ? predictive.decayPressure / 100 : fatigue;
  const hiPri = initiatives.priorities.reduce((m, p) => Math.max(m, PRIORITY_RANK[p] ?? 0), 0);
  const initiativeHeat = clamp(hiPri / 5, 0, 1);

  const breathPhase = (Math.sin(pulseGeneration * 0.31) * 0.5 + 0.5) * (1 - drag * 0.25) + drag * 0.08;
  const periodBase =
    regime === "production_load" || initiativeUrgency === "critical"
      ? 112
      : regime === "opportunity"
        ? 82
        : 96;
  const periodSec = periodBase + Math.round(pNorm * 18);

  const executiveBreath: ExecutiveBreath = {
    phase01: clamp(breathPhase, 0, 1),
    periodSec,
    microcopyRu:
      drag > 0.55
        ? "Исполнительное дыхание укорочено — drag тянет фазу recovery."
        : pNorm > 0.62
          ? "Дыхание контура сжато под давлением; стабильность требует паузы между импульсами."
          : "Ритм контура ровный: премиальная сдержанность без скачков нервной сети.",
  };

  const edgeGlow = clamp(0.08 + pNorm * 0.22 + (fabric?.avgIntensity ?? 0) / 500, 0.06, 0.38);
  const cognitivePulse: CognitivePulse = {
    edgeGlow01: edgeGlow,
    propagationSec: 88 + Math.round(vol * 40),
  };

  const tempo: SystemRhythm["tempoLabelRu"] =
    pNorm > 0.65 || initiativeUrgency === "critical" ? "напряжённый" : pNorm > 0.45 ? "средний" : "спокойный";
  const systemRhythm: SystemRhythm = {
    periodSec,
    tempoLabelRu: tempo,
  };

  const velocitySigned = Math.sin(pulseGeneration * 0.47) * (0.15 + pNorm * 0.25);
  const pressureWave: PressureWave = {
    amplitude01: clamp(pNorm * 0.85 + drag * 0.35, 0, 1),
    velocitySigned: clamp(velocitySigned, -1, 1),
  };

  const h = hashStr(decision.priorityHeadlineRu + String(pulseGeneration));
  const attentionShift: AttentionShift = {
    focusX01: ((h >> 3) & 255) / 255,
    focusY01: ((h >> 11) & 255) / 255,
    captionRu: `Вектор внимания смещён к ${clip(decision.priorityHeadlineRu, 72)}`,
  };

  const riskAvg =
    (decision.riskCtrFatigue +
      decision.riskBrandDilution +
      decision.riskSaturationProb +
      decision.riskProductionOverload) /
    400;
  let confidenceDrift: ConfidenceDrift = {
    deltaSigned: Math.round((conf - 0.72) * 100 + (0.55 - riskAvg) * 40),
    settling01: clamp(1 - Math.abs(conf - 0.68) * 2 - riskAvg * 0.5, 0, 1),
    captionRu:
      conf > 0.74 && riskAvg < 0.52
        ? "Уверенность контура оседает вокруг исполнения без дрейфа."
        : "Уверенность подпружинена рисками — допускается микродрейф до следующего окна.",
  };

  const driversRu: string[] = [];
  if (decision.riskSaturationProb > 52) driversRu.push(`Насыщение · p ${decision.riskSaturationProb}%`);
  if (decision.riskCtrFatigue > 52) driversRu.push(`CTR fatigue ${decision.riskCtrFatigue}%`);
  if (decision.riskProductionOverload > 50) driversRu.push(`Производство ${decision.riskProductionOverload}%`);
  if (fabric && fabric.conflictCount > 0) driversRu.push(`Конфликты сигнальной ткани: ${fabric.conflictCount}`);
  if (driversRu.length === 0) driversRu.push("Темп стратегического натяжения умеренный — контур в дисциплине.");

  let strategicTension: StrategicTension = {
    index01: clamp(pNorm * 0.45 + riskAvg * 0.55 + (fabric?.conflictCount ?? 0) * 0.02 + initiativeHeat * 0.08, 0, 1),
    driversRu,
  };

  let stabilityFlow: StabilityFlow = {
    inertia01: clamp(synthesis.launchReadiness / 100 - drag * 0.35, 0, 1),
    recoveryBias01: clamp((1 - pNorm) * 0.55 + temporal.patienceScore / 200, 0, 1),
    captionRu:
      synthesis.launchReadiness > 68
        ? "Поток стабильности тянет к запуску — окно держит форму."
        : "Стабильность накапливается медленнее; приоритет — снять drag перед новой волной.",
  };

  if (executiveMemoryHints) {
    strategicTension = {
      ...strategicTension,
      index01: clamp(strategicTension.index01 + executiveMemoryHints.tensionBias, 0, 1),
    };
    confidenceDrift = {
      ...confidenceDrift,
      settling01: clamp(confidenceDrift.settling01 + executiveMemoryHints.confidenceBias, 0, 1),
    };
    stabilityFlow = {
      ...stabilityFlow,
      inertia01: clamp(stabilityFlow.inertia01 + executiveMemoryHints.stabilityBias, 0, 1),
    };
  }

  if (selfEvolvingHints) {
    strategicTension = {
      ...strategicTension,
      index01: clamp(strategicTension.index01 + selfEvolvingHints.tensionDelta, 0, 1),
    };
    confidenceDrift = {
      ...confidenceDrift,
      settling01: clamp(confidenceDrift.settling01 + selfEvolvingHints.confidenceDelta, 0, 1),
    };
    stabilityFlow = {
      ...stabilityFlow,
      inertia01: clamp(stabilityFlow.inertia01 + selfEvolvingHints.stabilityDelta, 0, 1),
    };
  }

  const profile = mapExecutiveProfile(regime, synthesis.pressureIndex, initiativeUrgency, synthesis.launchReadiness);
  const motionIntensity = clamp(0.25 + pNorm * 0.35 + (initiativeUrgency === "critical" ? 0.35 : 0), 0, 1);
  const profileLabels: Record<ExecutiveRegimeProfile, string> = {
    expansion: "Режим расширения · контур чуть острее",
    recovery: "Режим recovery · пульс мягче, сеть осторожнее",
    premium_defense: "Premium defense · плотность сигналов сдержана",
    observation: "Наблюдение · минимальная агрессия движения",
    silent_accumulation: "Тихое накопление · почти невидимый рост напряжённости",
  };
  const regimeTransition: RegimeTransition = {
    profile,
    motionIntensity01: motionIntensity,
    labelRu: profileLabels[profile],
  };

  let stripSecondaryRu = `Время: ${TEMPORAL_PHASE_RU[temporal.phase]} · CTR decay ${temporal.decay.ctrFatigue}% · терпение контура ${temporal.patienceScore}% · ${clip(temporal.bestLaunchWindowRu, 72)}`;
  if (executiveMemoryHints?.stripEchoRu) {
    stripSecondaryRu = `${stripSecondaryRu} · ${executiveMemoryHints.stripEchoRu}`;
  }
  if (selfEvolvingHints?.stripRu) {
    stripSecondaryRu = `${stripSecondaryRu} · ${selfEvolvingHints.stripRu}`;
  }

  let stripWarningRu: string | null = null;
  if (orchestration.operationalDrag > 64) stripWarningRu = "Временное предупреждение: операционный drag перегружает исполнение.";
  else if (decision.riskProductionOverload > 58) stripWarningRu = "Производственный слой близок к перегреву — снизить параллельные маршруты.";
  else if (fabric && fabric.conflictCount > 2) stripWarningRu = "Сигнальная ткань фиксирует конфликтные зоны — проверить зависимости.";

  const signalMotionSec = clamp(118 - motionIntensity * 22 + pNorm * 12, 72, 132);
  const fabricHazeOpacityMul = clamp(0.48 + strategicTension.index01 * 0.22 + (fabric?.avgIntensity ?? 0) / 400, 0.38, 0.82);
  const fabricPathOpacityMul = clamp(0.85 + edgeGlow * 0.35, 0.75, 1.15);

  const weather = marketWeatherFromSignals(pulseGeneration, strategicTension.index01, fatigue, vol);
  const weather3 = marketWeather3FromSignals(pulseGeneration, strategicTension.index01, fatigue, vol);
  const w3s = weather3ShellScalars(weather3, strategicTension.index01);
  const org = organismShellMultipliers(strategicTension.index01, fatigue, vol, weather);
  const pulseMessageKey = globalMarketPulseMessageKey(pulseGeneration, strategicTension.index01, pNorm);
  const executiveSilence01 = clamp(
    w3s.executiveSilence01 +
      (profile === "silent_accumulation" ? 0.12 : 0) * (1 - strategicTension.index01) +
      (profile === "observation" ? 0.06 : 0) * (1 - strategicTension.index01),
    0,
    1,
  );

  const live: LiveState = {
    pulseGeneration,
    executiveBreath,
    cognitivePulse,
    systemRhythm,
    pressureWave,
    attentionShift,
    confidenceDrift,
    strategicTension,
    stabilityFlow,
    regimeTransition,
    stripSecondaryRu,
    stripWarningRu,
    signalMotionSec,
    fabricHazeOpacityMul,
    fabricPathOpacityMul,
    executiveSilence01,
    strategicOrganism: {
      weatherId: weather,
      weather3Id: weather3,
      pulseMessageKey,
    },
  };

  const cssVars: LiveShellCssVars = {
    "--live-breath": String(clamp(breathPhase, 0, 1)),
    "--live-tension": String(strategicTension.index01),
    "--live-pressure": String(pNorm),
    "--live-confidence": String(conf),
    "--live-fatigue": String(fatigue),
    "--live-haze-sec": `${Math.round((periodSec + decayP * 24) / w3s.motionCadenceMul)}s`,
    "--live-field-opacity": String(clamp(0.028 + edgeGlow * 0.06 + w3s.topologyEmphasis01 * 0.012, 0.02, 0.09)),
    "--live-spine-pulse-sec": `${Math.round((12 + (1 - motionIntensity) * 10) / w3s.motionCadenceMul)}s`,
    "--live-strip-shimmer": String(clamp(0.04 + motionIntensity * 0.08 + w3s.signalSharpness01 * 0.04, 0.03, 0.16)),
    "--live-organism-glow": String(org.glow01 * (0.92 + w3s.topologyEmphasis01 * 0.14)),
    "--live-weather-contrast": String(org.contrastMul * (0.98 + w3s.signalSharpness01 * 0.06)),
    "--live-weather-sat": String(org.saturationMul * (0.97 + w3s.topologyEmphasis01 * 0.05)),
    "--live-topology-emphasis": String(w3s.topologyEmphasis01),
    "--live-signal-sharpness": String(w3s.signalSharpness01),
    "--live-executive-silence": String(executiveSilence01),
    "--live-motion-cadence": String(w3s.motionCadenceMul),
  };

  function moduleActivity(id: NavId): ModuleLiveActivity {
    return deriveModuleLiveActivity(id, modules[id]);
  }

  return { live, cssVars, moduleActivity };
}

export function buildModuleLiveMap(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>): Partial<Record<NavId, ModuleLiveActivity>> {
  const out: Partial<Record<NavId, ModuleLiveActivity>> = {};
  for (const id of COGNITIVE_NETWORK_IDS) {
    out[id] = deriveModuleLiveActivity(id, modules[id]);
  }
  return out;
}
