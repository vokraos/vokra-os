import type { NavId } from "../../types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type { CognitiveSynthesisState, DecisionEngineState, MarketRegime, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import type {
  HorizonTrajectory,
  NarrativeContinuity,
  TemporalDecaySnapshot,
  TemporalMemoryHints,
  TemporalPhase,
  TemporalStrategySnapshot,
  TemporalTimelineCard,
  TemporalHorizonKey,
  TimingRecommendation,
  TemporalIntegrationSignals,
} from "./types";
import { TEMPORAL_PHASE_RU } from "./types";
import { clamp, hashStr } from "../math";

function detectPhase(
  regime: MarketRegime,
  pressureIndex: number,
  launchReadiness: number,
  ctrFatigue: number,
  saturationRisk: number,
  seed: number,
): { phase: TemporalPhase; confidence: number } {
  const h = hashStr(`${regime}-${pressureIndex}-${launchReadiness}-${ctrFatigue}-${seed}`) % 1000;

  if (regime === "production_load" && pressureIndex > 58) {
    return { phase: "peak", confidence: clamp(72 + (h % 18)) };
  }
  if (regime === "saturation" && ctrFatigue > 55) {
    return { phase: "fatigue", confidence: clamp(68 + (h % 22)) };
  }
  if (regime === "saturation" && saturationRisk > 62) {
    return { phase: "decline", confidence: clamp(60 + (h % 20)) };
  }
  if (regime === "opportunity" && launchReadiness > 68 && pressureIndex < 48) {
    return { phase: "acceleration", confidence: clamp(70 + (h % 25)) };
  }
  if (regime === "opportunity" && pressureIndex < 42) {
    return { phase: "emergence", confidence: clamp(62 + (h % 20)) };
  }
  if (ctrFatigue > 48 && launchReadiness < 52) {
    return { phase: "reinvention", confidence: clamp(55 + (h % 24)) };
  }
  if (regime === "balanced") {
    return h % 2 === 0
      ? { phase: "acceleration", confidence: clamp(52 + (h % 18)) }
      : { phase: "peak", confidence: clamp(50 + (h % 18)) };
  }
  return { phase: "acceleration", confidence: clamp(58 + (h % 15)) };
}

function buildDecay(d: DecisionEngineState, modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>): TemporalDecaySnapshot {
  const visual = modules.visual?.pressure ?? 40;
  const seo = modules.seo?.pressure ?? 38;
  const comp = modules.competitors?.pressure ?? 36;
  const ops = modules.operations?.pressure ?? modules.operationsBrief?.pressure ?? 38;
  return {
    ctrFatigue: clamp(d.riskCtrFatigue + Math.round((visual - 40) * 0.15)),
    visualFatigue: clamp(Math.round(visual * 0.85 + d.riskCtrFatigue * 0.12)),
    emotionalNoveltyDecay: clamp(100 - d.rank.brandFit + Math.round((100 - d.rank.marginPotential) * 0.2)),
    seoSaturation: clamp(d.riskSaturationProb + Math.round(seo * 0.25)),
    competitorImitation: clamp(comp + Math.round(d.riskPricingPressure * 0.35)),
    productionOverload: clamp(d.riskProductionOverload + Math.round(ops * 0.2)),
  };
}

function pickTiming(
  phase: TemporalPhase,
  regime: MarketRegime,
  decay: TemporalDecaySnapshot,
  launchReadiness: number,
  seed: number,
): TimingRecommendation {
  const h = hashStr(`${phase}-${regime}-${seed}`) % 7;
  if (decay.productionOverload > 72) return "scale_fbo";
  if (decay.visualFatigue > 68 || decay.ctrFatigue > 68) return "refresh_visuals";
  if (phase === "decline" || regime === "saturation") return "stop_expansion";
  if (phase === "reinvention") return "reinvent_concept";
  if (phase === "fatigue") return h % 2 === 0 ? "wait" : "refresh_visuals";
  if (phase === "emergence") return "test_quietly";
  if (phase === "acceleration" && launchReadiness > 70) return "launch_now";
  if (phase === "peak" && regime === "opportunity") return "launch_now";
  if (phase === "peak") return "wait";
  return "test_quietly";
}

function buildHorizons(
  phase: TemporalPhase,
  decay: TemporalDecaySnapshot,
  cluster: string,
  seed: number,
): readonly HorizonTrajectory[] {
  const h = hashStr(`h-${phase}-${seed}`) % 500;
  const mk = (horizon: TemporalHorizonKey, base: number, tr: string, rk: string, op: string): HorizonTrajectory => ({
    horizon,
    intensity: clamp(base + (h % 20) - 10),
    trajectoryRu: tr,
    riskHintRu: rk,
    opportunityRu: op,
  });

  return [
    mk(
      "d7",
      58,
      `Краткий горизонт: импульс фазы «${TEMPORAL_PHASE_RU[phase]}» — корректировка proof и CTR в приоритете.`,
      decay.ctrFatigue > 55 ? "Риск: быстрый спад отклика на статичных карточках." : "Риск умеренный; держать героя узким.",
      "Окно: точечные A/B motion, без расширения SKU.",
    ),
    mk(
      "d30",
      52,
      "Средний горизонт: эволюция кампании и визуального ритма синхронизируются с маркетплейс-каденсом.",
      decay.seoSaturation > 58 ? "Риск: семантическое сгущение в кластере." : "SEO: укрепление entity-героя.",
      "Оптимизация: капсула + rich narrative под один якорь.",
    ),
    mk(
      "d90",
      48,
      "Долгий горизонт: жизненный цикл SKU и сезонность задают темп масштаба FBO.",
      decay.productionOverload > 55 ? "Риск: перегруз производства при параллельных дропах." : "Производство: стабильная полоса.",
      "Long-tail: наращивать глубину, не ширину кластера.",
    ),
    mk(
      "seasonal",
      62,
      `Сезонное окно привязано к кластеру «${cluster}» — фаза ${TEMPORAL_PHASE_RU[phase]} определяет агрессию промо.`,
      decay.competitorImitation > 52 ? "Риск: зеркалирование офферов конкурентами." : "Конкуренция: контролируемая.",
      "Сместить акцент на gift / archive до пика сезона.",
    ),
    mk(
      "longTail",
      44,
      "Long-tail потенциал: устойчивость темы зависит от непрерывности бренд-нарратива и редкости визуала.",
      decay.emotionalNoveltyDecay > 58 ? "Риск: истощение эмоциональной новизны." : "Новизна: ещё в рабочем коридоре.",
      "Удерживать премиальную подпись в SEO и витрине.",
    ),
  ];
}

function buildNarrative(
  phase: TemporalPhase,
  memory: TemporalMemoryHints,
  cluster: string,
  seed: number,
): NarrativeContinuity {
  const h = hashStr(`nar-${seed}`) % 400;
  const trendLine =
    memory.recentTrendTitle != null
      ? `Слой памяти Trend Radar («${memory.recentTrendTitle}») задаёт вектор темы.`
      : "Память Trend Radar пока разрежена — контур опирается на синтез и командный центр.";
  const cmdLine =
    memory.strategicCommandCount > 0
      ? `Зафиксировано ${memory.strategicCommandCount} стратегических прогонов Command Center — преемственность решений усилена.`
      : "Command Center: мало зафиксированных стратегических прогонов в памяти — зафиксируйте брифы для преемственности.";

  return {
    themeEvolutionRu: `Тема «${cluster}» в фазе ${TEMPORAL_PHASE_RU[phase]}: ${trendLine} ${cmdLine}`,
    visualLanguageChangeRu:
      phase === "fatigue" || phase === "decline"
        ? "Визуал: сместить кино-контраст и motion; уменьшить повторяемость still-life в герое."
        : "Визуал: удержать noir-минимализм и negative space; варьировать только ритм кадра и световую ось.",
    consistencyAnchorRu:
      "Постоянство: палитра, типографика героя, тон коммуникации Brand DNA — не ломать при обновлении дропов.",
    nextDropTimingRu:
      h % 2 === 0
        ? "Следующий дроп: после стабилизации CTR (≈14–21 день) или в раннем сезонном окне — не в пике усталости."
        : "Следующий дроп: микро-капсуля перед сезонным ускорением; крупный масштаб — только при подтверждённой полосе FBO.",
  };
}

function buildIntegration(
  initiatives: readonly StrategicInitiative[],
  memory: TemporalMemoryHints,
  synthesis: CognitiveSynthesisState,
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
): TemporalIntegrationSignals {
  const top = initiatives[0];
  const initRu = top
    ? `Initiative Engine: «${top.headlineRu.slice(0, 120)}${top.headlineRu.length > 120 ? "…" : ""}»`
    : "Initiative Engine: фоновый контур без критических инициатив.";
  const memRu = `Память проекта: Trend Radar ${memory.trendRadarCount} · Command ${memory.strategicCommandCount}.`;
  const mc = modules.missionControl;
  const mcRu = mc
    ? `Mission Control: давление ${Math.round(mc.pressure)}% · уверенность ${Math.round(mc.confidence)}%.`
    : "Mission Control: номинальное давление контура.";
  const tr = modules.trends;
  const trRu = tr
    ? `Trend Radar: активность ${tr.activity} · сигнал ${Math.round(tr.signalHealth)}%.`
    : "Trend Radar: модуль в фоне.";
  const cmd = modules.command;
  const cmdRu = cmd
    ? `Strategic Command: синхронизация ${cmd.sync} · готовность к окну запуска ${synthesis.launchReadiness}%.`
    : "Strategic Command: ожидание фиксации окна.";

  return {
    initiativeSummaryRu: initRu,
    memorySummaryRu: memRu,
    missionControlRu: mcRu,
    trendRadarRu: trRu,
    strategicCommandRu: cmdRu,
  };
}

function buildTimeline(phase: TemporalPhase, seed: number): readonly TemporalTimelineCard[] {
  const h = hashStr(`tl-${seed}`) % 200;
  return [
    {
      id: "tl-7",
      horizon: "d7",
      titleRu: "7 дней — микрокоррекция",
      bodyRu:
        phase === "fatigue"
          ? "Перевести часть бюджета proof в motion; не открывать новые SKU."
          : "Зафиксировать героя и CTR baseline; подготовить капсульный вход.",
      emphasis: phase === "emergence" ? "low" : "mid",
    },
    {
      id: "tl-30",
      horizon: "d30",
      titleRu: "30 дней — эволюция кампании",
      bodyRu: "Свести визуальную усталость и SEO-дрейф к одному narrative-якорю; синхронизировать маркетплейс-промо.",
      emphasis: "high",
    },
    {
      id: "tl-90",
      horizon: "d90",
      titleRu: "90 дней — жизненный цикл и FBO",
      bodyRu: `Фаза «${TEMPORAL_PHASE_RU[phase]}» к ${90 + (h % 14)} дню: решить масштаб FBO и глубину long-tail без распыления матрицы.`,
      emphasis: phase === "decline" || phase === "reinvention" ? "high" : "mid",
    },
  ];
}

function patienceScoreFrom(decay: TemporalDecaySnapshot, pressureIndex: number, phase: TemporalPhase): number {
  const stress = (decay.ctrFatigue + decay.visualFatigue + decay.productionOverload) / 3;
  let bonus = 0;
  if (phase === "emergence" || phase === "acceleration") bonus = 8;
  if (phase === "reinvention") bonus = 5;
  return clamp(Math.round(92 - stress * 0.45 - pressureIndex * 0.22 + bonus));
}

export type BuildTemporalStrategyInput = {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  regime: MarketRegime;
  initiatives: readonly StrategicInitiative[];
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  pulseGeneration: number;
  memoryHints: TemporalMemoryHints;
};

export function buildTemporalStrategySnapshot(input: BuildTemporalStrategyInput): TemporalStrategySnapshot {
  const { synthesis, decision, regime, initiatives, modules, pulseGeneration, memoryHints } = input;
  const seed = hashStr(`${regime}-${pulseGeneration}-${synthesis.dominantClusterRu}-${synthesis.pressureIndex}`);
  const decay = buildDecay(decision, modules);
  const { phase, confidence } = detectPhase(
    regime,
    synthesis.pressureIndex,
    synthesis.launchReadiness,
    decay.ctrFatigue,
    decision.rank.saturationRisk,
    seed,
  );
  const recommendedTiming = pickTiming(phase, regime, decay, synthesis.launchReadiness, seed);
  const horizons = buildHorizons(phase, decay, synthesis.dominantClusterRu, seed);
  const narrative = buildNarrative(phase, memoryHints, synthesis.dominantClusterRu, seed);
  const integration = buildIntegration(initiatives, memoryHints, synthesis, modules);
  const timelineCards = buildTimeline(phase, seed);
  const patienceScore = patienceScoreFrom(decay, synthesis.pressureIndex, phase);

  const nextRisk =
    decay.ctrFatigue > decay.visualFatigue
      ? `Ближайшее окно риска: CTR и витрина — ${decay.ctrFatigue > 65 ? "7–18 дней" : "14–28 дней"} при текущей структуре героя.`
      : `Ближайшее окно риска: визуальная усталость — ${decay.visualFatigue > 65 ? "10–24 дня" : "18–40 дней"} без motion-обновления.`;

  const bestLaunch =
    recommendedTiming === "launch_now"
      ? "Лучшее окно запуска: сейчас — при подтверждённой полосе производства и узкой капсуле."
      : recommendedTiming === "test_quietly"
        ? "Лучшее окно: тихий тест DTF в 7–12 дней до сезонного шума."
        : recommendedTiming === "wait"
          ? "Лучшее окно: выждать 14–21 день — снизить конкурирующие промо и перегрев ниши."
          : recommendedTiming === "refresh_visuals"
            ? "Лучшее окно: после refresh визуала (5–14 дней) — затем точечный дроп."
            : recommendedTiming === "scale_fbo"
              ? "Лучшее окно: масштаб FBO после снятия пика очереди печати (10–20 дней)."
              : recommendedTiming === "stop_expansion"
                ? "Лучшее окно: пауза расширения; удержание маржи до охлаждения кластера."
                : "Лучшее окно: reinvent — новая концептуальная ось через 21–45 дней под Brand DNA.";

  const fatigueFc =
    `Прогноз усталости: CTR ${decay.ctrFatigue}% · визуал ${decay.visualFatigue}% · эмоциональный декей ${decay.emotionalNoveltyDecay}% (модель контура).`;

  return {
    generatedAt: Date.now(),
    pulseGeneration,
    phase,
    phaseConfidence: confidence,
    nextRiskWindowRu: nextRisk,
    bestLaunchWindowRu: bestLaunch,
    fatigueForecastRu: fatigueFc,
    horizons,
    decay,
    recommendedTiming,
    narrative,
    patienceScore,
    timelineCards,
    integration,
  };
}
