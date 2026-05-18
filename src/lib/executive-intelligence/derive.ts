import type { VokraBrandConstitution } from "../brand-dna/types";
import type { CognitiveSynthesisState, DecisionEngineState, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type { TemporalStrategySnapshot } from "../temporal-strategy/types";
import type { SignalFabricSnapshot } from "../signal-fabric/types";
import type { ExecutionOrchestrationSnapshot } from "../execution-orchestrator/types";
import type { PredictiveEngineSnapshot } from "../predictive-engine/types";
import type { NavId } from "../../types";
import { buildFeedbackLoop } from "../feedback-loop/derive";
import { buildBrandEvolution } from "../brand-evolution/derive";
import type {
  CognitiveConflict,
  ExecutiveConfidence,
  ExecutiveDirective,
  ExecutiveRegime,
  ExecutiveSnapshot,
  ExecutivePriority,
  GlobalRiskVector,
  MetaSignal,
  StrategicContradiction,
  StrategicPressureMap,
  SystemConsensus,
} from "./types";
import { clamp, hashStr } from "../math";

export type BuildExecutiveIntelligenceInput = {
  constitution: VokraBrandConstitution;
  orchestration: ExecutionOrchestrationSnapshot;
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  initiatives: readonly StrategicInitiative[];
  temporal: TemporalStrategySnapshot;
  fabric: SignalFabricSnapshot | null;
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  predictive: PredictiveEngineSnapshot;
  pulseGeneration: number;
  memoryGenerationCount: number;
  memoryProjectCount: number;
};

function pickExecutiveRegime(input: {
  dnaGate: string;
  synthesisRegime: string;
  dtf: number;
  expansionBias: number;
  brandInt: number;
    saturationProb: number;
    ctrFatigue: number;
    seoLev: number;
}): { regime: ExecutiveRegime; explanationRu: string } {
  const { dnaGate, synthesisRegime, dtf, expansionBias, brandInt, saturationProb, ctrFatigue, seoLev } = input;
  if (dnaGate === "hold") {
    return {
      regime: "premium_defense",
      explanationRu:
        "Brand DNA hold: исполнительный контур переводит организм в режим защиты premium — без расширения визуала и кампаний до снятия gate.",
    };
  }
  if (dtf > 64 && expansionBias > 56) {
    return {
      regime: "consolidation",
      explanationRu:
        "Высокое давление DTF при агрессивном expansion bias: консолидация до стабилизации производства и FBO depth — иначе система теряет когерентность исполнения.",
    };
  }
  if (brandInt < 52 && expansionBias > 54) {
    return {
      regime: "controlled_aggression",
      explanationRu:
        "Рынок тянет в расширение при ослаблении brand integrity forecast: разрешена только контролируемая агрессия в hero SKU и кластере, не в поле линейки.",
    };
  }
  if (seoLev > 62 && ctrFatigue > 54) {
    return {
      regime: "observation",
      explanationRu:
        "SEO leverage высок при визуальной усталости: режим наблюдения — расширение семантики без refresh героя разрушает premium perception.",
    };
  }
  if (synthesisRegime === "opportunity" && brandInt > 68 && dtf < 58) {
    return {
      regime: "expansion",
      explanationRu:
        "Окно синтеза + стабильный integrity + производственный коридор: организм допускает расширение в рамках конституции и narrative coherence.",
    };
  }
  if (saturationProb > 62 || synthesisRegime === "saturation") {
    return {
      regime: "silent_accumulation",
      explanationRu:
        "Насыщение / saturation regime: тихое накопление proof, карточки и памяти — без шумного масштаба до смены фазы temporal.",
    };
  }
  if (synthesisRegime === "production_load" || dtf > 58) {
    return {
      regime: "recovery",
      explanationRu:
        "Production load: восстановление очереди и снижение параллельных волн — executive priority на операционный долг до следующего launch window.",
    };
  }
  return {
    regime: "observation",
    explanationRu:
      "Режим наблюдения: контуры в допустимом коридоре — держать каденс Mission Control и мониторить Signal Fabric без форсированного масштаба.",
  };
}

export function buildExecutiveIntelligence(input: BuildExecutiveIntelligenceInput): ExecutiveSnapshot {
  const now = Date.now();
  const {
    constitution,
    orchestration: orch,
    synthesis,
    decision,
    initiatives,
    temporal,
    fabric,
    modules,
    predictive,
    pulseGeneration,
    memoryGenerationCount,
    memoryProjectCount,
  } = input;

  const seed = hashStr(`eic-${pulseGeneration}`);
  const dnaGate = modules.dna?.brandGate ?? "ok";
  const fb = buildFeedbackLoop({
    orchestration: orch,
    synthesis,
    decision,
    initiatives,
    temporal,
    fabric,
    modules,
    pulseGeneration,
  });
  const bev = buildBrandEvolution({
    constitution,
    orchestration: orch,
    synthesis,
    decision,
    initiatives,
    temporal,
    fabric,
    modules,
    predictive,
    pulseGeneration,
    memoryGenerationCount,
    memoryProjectCount,
  });

  const foresight = predictive.foresight;
  const mid = predictive.scenarios[1] ?? predictive.scenarios[0]!;
  const out = mid.outcome;
  const dtf = orch.resourcePressure.dtfQueue;
  const fbo = orch.resourcePressure.fboReadiness;
  const contentLoad = orch.resourcePressure.contentLoad;
  const campaignP = orch.resourcePressure.campaignPressure;
  const seoLev = decision.rank.seoLeverage;
  const ctrF = temporal.decay.ctrFatigue;
  const visF = temporal.decay.visualFatigue;
  const seoSat = temporal.decay.seoSaturation;
  const brandInt = foresight.brandIntegrityForecast;
  const satProb = foresight.saturationProbability;
  const marketP = fabric?.pressures.market ?? 46;
  const brandP = fabric?.pressures.brand ?? 54;
  const prodP = fabric?.pressures.production ?? orch.resourcePressure.dtfQueue;

  const { regime, explanationRu: regimeExplanationRu } = pickExecutiveRegime({
    dnaGate,
    synthesisRegime: synthesis.regime,
    dtf,
    expansionBias: predictive.expansionBias,
    brandInt,
    saturationProb: satProb,
    ctrFatigue: ctrF,
    seoLev,
  });

  const strategicContradictions: StrategicContradiction[] = [
    {
      id: "sc-opp-dna",
      summaryRu: "Высокий sales opportunity vs риск dilution Brand DNA",
      tensionRu: `Скорость/маржа в ранге (${decision.rank.speedPotential}% / ${decision.rank.marginPotential}%) против brand fit ${decision.rank.brandFit}% и premium perception ${out.premiumPerception}%.`,
      severity: clamp(42 + Math.round((decision.rank.speedPotential - out.premiumPerception) * 0.35)),
    },
    {
      id: "sc-scale-prod",
      summaryRu: "Fast scale vs production overload",
      tensionRu: `Expansion bias ${predictive.expansionBias}% при DTF queue ${dtf}% и FBO readiness ${fbo}% — оркестратор фиксирует operational drag ${orch.operationalDrag}%.`,
      severity: clamp(48 + Math.round((dtf + predictive.expansionBias) * 0.22)),
    },
    {
      id: "sc-seo-visual",
      summaryRu: "SEO expansion vs visual fatigue",
      tensionRu: `SEO leverage ${seoLev}% и SEO saturation ${seoSat}% на фоне CTR fatigue ${ctrF}% и визуальной усталости ${visF}% — карточка не должна опережать hero refresh.`,
      severity: clamp(38 + Math.round((seoLev + visF) * 0.25)),
    },
    {
      id: "sc-promo-premium",
      summaryRu: "Premium positioning vs aggressive promo pressure",
      tensionRu: `Ценовое давление ${decision.riskPricingPressure}% и campaign pressure ${campaignP}% против exclusivity long-run ${out.exclusivityLongRun}% — контур сужает скидочные импульсы.`,
      severity: clamp(40 + Math.round((decision.riskPricingPressure + campaignP) * 0.2)),
    },
  ];

  const cognitiveConflicts: CognitiveConflict[] = [
    {
      id: "cc-1",
      titleRu: "Конфликт: маркетплейс тянет в шум, ДНК требует тишины",
      poleARu: `Market pressure ${marketP}% (Signal Fabric)`,
      poleBRu: `Brand shell ${brandP}% + noir constitution`,
      severity: clamp(36 + (bev.dilutionRisks[0]?.severity ?? 40) / 2),
      resolutionHintRu: "Executive Core: не поднимать масштаб SKU вне hero-кластера до выравнивания brand integrity.",
    },
    {
      id: "cc-2",
      titleRu: "Конфликт: контент-нагрузка vs narrative coherence",
      poleARu: `Content load ${contentLoad}% · память ${memoryGenerationCount} генераций`,
      poleBRu: `Narrative coherence (sim) — brand memory ${out.brandMemory}%`,
      severity: clamp(32 + Math.round(contentLoad * 0.35)),
      resolutionHintRu: "Перенести фокус с расширения на укрепление narrative: меньше параллельных веток, больше proof слоя.",
    },
  ];

  const pressureMap: StrategicPressureMap = {
    cells: [
      { id: "pp-prod", axisRu: "Производство / DTF", value: dtf, noteRu: orch.resourcePressure.summaryRu.slice(0, 80) },
      { id: "pp-vis", axisRu: "Визуал / усталость", value: visF, noteRu: "Кинематографический контур и CTR fatigue как связка." },
      { id: "pp-seo", axisRu: "SEO", value: clamp(seoLev), noteRu: `Saturation ${seoSat}% · leverage ${seoLev}%` },
      { id: "pp-prem", axisRu: "Premium perception", value: out.premiumPerception, noteRu: "Strategic Simulation outcome vector." },
      { id: "pp-sat", axisRu: "Насыщение рынка", value: satProb, noteRu: "Foresight saturation probability + synthesis regime." },
      { id: "pp-launch", axisRu: "Launch timing", value: synthesis.launchReadiness, noteRu: synthesis.activeMissionRu.slice(0, 72) },
      { id: "pp-fbo", axisRu: "FBO pressure", value: clamp(100 - fbo), noteRu: "Инверсия readiness: выше значение — сильнее давление на depth." },
      { id: "pp-content", axisRu: "Content overload", value: contentLoad, noteRu: "Execution Orchestrator resource map." },
      { id: "pp-emotion", axisRu: "Эмоциональная усталость", value: temporal.decay.emotionalNoveltyDecay, noteRu: "Temporal decay model." },
      { id: "pp-narr", axisRu: "Narrative coherence", value: out.brandMemory, noteRu: "Долгая связность vs short-term CTR." },
    ],
  };

  const directives: ExecutiveDirective[] = [
    {
      id: "dir-1",
      directiveRu: "Замедлить масштабирование до стабилизации premium perception.",
      rationaleRu: `Brand integrity forecast ${brandInt}% ниже коридора при expansion bias ${predictive.expansionBias}%.`,
      feedsIntoRu: ["Initiative Engine", "Execution Orchestrator", "Strategic Simulation"],
    },
    {
      id: "dir-2",
      directiveRu: "Разрешить расширение SKU только в hero-кластере.",
      rationaleRu: "Снижение entropy линейки: Feedback Loop и Brand Evolution согласуют dilution risk.",
      feedsIntoRu: ["Action Command Layer", "Brand Evolution", "Temporal Strategy"],
    },
    {
      id: "dir-3",
      directiveRu: "Перенести фокус с расширения на укрепление narrative.",
      rationaleRu: `Контент ${contentLoad}% и память проектов — ${memoryProjectCount} проект(ов); executive memory: ${decision.executiveMemoryRu.slice(0, 90)}…`,
      feedsIntoRu: ["Strategic Command", "Project Memory", "Mission Control"],
    },
    {
      id: "dir-4",
      directiveRu: "Удержать FBO-волну до порога readiness; не параллелить с пиком DTF.",
      rationaleRu: `FBO readiness ${fbo}% · DTF ${dtf}% — оркестратор: ${orch.nextBestActionRu.slice(0, 100)}…`,
      feedsIntoRu: ["Execution Orchestrator", "Action Command Layer", "Production systems"],
    },
  ];

  const priorityShifts: ExecutivePriority[] = [
    {
      id: "ps-1",
      labelRu: "Сдвиг приоритета: исполнение → защита ДНК",
      fromRu: "Масштаб и скорость карточек",
      toRu: "Проверка Brand DNA и noir proof",
      urgency: clamp(58 + (dnaGate === "hold" ? 22 : 0)),
    },
    {
      id: "ps-2",
      labelRu: "Сдвиг: SEO кластер → визуальный герой",
      fromRu: `Расширение long-tail при ${seoLev}% leverage`,
      toRu: "Hero SKU refresh до SEO push",
      urgency: clamp(44 + Math.round(ctrF * 0.25)),
    },
    {
      id: "ps-3",
      labelRu: "Сдвиг: кампании → операционная стабильность",
      fromRu: `Campaign pressure ${campaignP}%`,
      toRu: "DTF/FBO и Mission Control SLA",
      urgency: clamp(50 + Math.round(prodP * 0.2)),
    },
  ];

  const riskConcentration: GlobalRiskVector[] = [
    {
      id: "rv-1",
      domainRu: "Операционное ядро (DTF / FBO)",
      magnitude: clamp(Math.round((dtf + (100 - fbo)) / 2)),
      concentrationRu: "Риск сосредоточен в производственном кольце; cascading в Signal Fabric.",
    },
    {
      id: "rv-2",
      domainRu: "Премиум-восприятие",
      magnitude: clamp(100 - out.premiumPerception + Math.round(decision.riskBrandDilution * 0.25)),
      concentrationRu: "Концентрация в стыке маркетплейса и визуала; Trend Radar не должен переопределять DNA.",
    },
    {
      id: "rv-3",
      domainRu: "Карточка и CTR",
      magnitude: clamp(Math.round((ctrF + decision.riskCtrFatigue) / 2)),
      concentrationRu: "Feedback Loop фиксирует drift; Temporal задаёт окно наблюдения.",
    },
  ];

  const consensus: SystemConsensus[] = [
    {
      id: "cs-1",
      statementRu: "Mission Control + Strategic Command: удерживать единое окно запуска без расхождения приоритетов.",
      cohesion: clamp(72 + (seed % 12)),
    },
    {
      id: "cs-2",
      statementRu: "Signal Fabric + Temporal: согласованы по фазе давления рынка и усталости.",
      cohesion: fabric ? clamp(68 + (seed % 15)) : clamp(52),
    },
    {
      id: "cs-3",
      statementRu: "Brand DNA + Brand Evolution: защита noir превалирует над short-term viral сигналом.",
      cohesion: clamp(74 - (dnaGate === "hold" ? 8 : 0)),
    },
  ];

  const metaSignals: MetaSignal[] = [
    { id: "ms-mc", source: "Mission Control", digestRu: synthesis.biggestRiskRu.slice(0, 100), weight: clamp(synthesis.pressureIndex) },
    { id: "ms-sf", source: "Signal Fabric", digestRu: fabric ? `Core pressure ${fabric.corePressure}% · cascades ${fabric.cascades.length}` : "Fabric offline — консервативный executive bias.", weight: fabric ? fabric.corePressure : 28 },
    { id: "ms-ts", source: "Temporal Strategy", digestRu: temporal.bestLaunchWindowRu.slice(0, 100), weight: temporal.phaseConfidence },
    { id: "ms-sim", source: "Strategic Simulation", digestRu: `Volatility ${predictive.volatilityIndex}% · decay pressure ${predictive.decayPressure}%`, weight: predictive.signalLongevity },
    { id: "ms-orch", source: "Execution Orchestrator", digestRu: orch.integrationRu[0] ?? orch.systemsInvolvedRu[0] ?? "Маршруты синхронизированы.", weight: orch.executionConfidence },
    { id: "ms-cmd", source: "Action Command", digestRu: `Top command layer · ${orch.actionCommandLayer.commands.length} команд в контуре.`, weight: clamp(orch.actionCommandLayer.commands[0]?.priority ?? 60) },
    { id: "ms-fb", source: "Feedback Loop", digestRu: fb.systemLearnedRu[0]?.slice(0, 100) ?? "Обучение контура активно.", weight: clamp(60 + fb.events.length * 2) },
    { id: "ms-bev", source: "Brand Evolution", digestRu: bev.currentTrajectoryRu.slice(0, 120) + "…", weight: clamp(bev.evolutionVectors[0]?.magnitude ?? 55) },
    { id: "ms-tr", source: "Trend Radar", digestRu: `Модуль trends: давление ${modules.trends?.pressure ?? 44}% · sync ${modules.trends?.sync ?? "—"}`, weight: modules.trends?.signalHealth ?? 50 },
    { id: "ms-mem", source: "Project Memory", digestRu: `Артефакты: ${memoryGenerationCount} генераций / ${memoryProjectCount} проектов.`, weight: clamp(40 + Math.min(30, memoryGenerationCount / 3)) },
  ];

  const stabRaw = clamp(
    Math.round(
      (orch.executionConfidence +
        (100 - dtf) * 0.25 +
        brandInt * 0.25 +
        (fabric ? brandP : 52) * 0.2 +
        (100 - satProb) * 0.15) /
        2.2,
    ),
  );
  const stabilityIndex = clamp(stabRaw + (dnaGate === "hold" ? -8 : 0));

  const expansionConf = clamp(
    Math.round(
      predictive.expansionBias * 0.35 +
        out.premiumPerception * 0.35 +
        (100 - dtf) * 0.2 +
        brandInt * 0.1 -
        satProb * 0.15,
    ),
  );

  const narrativeCoh = clamp(Math.round((out.brandMemory + foresight.momentumStability) / 2));

  const executiveConfidence: ExecutiveConfidence = {
    ecosystemStability: stabilityIndex,
    expansionConfidence: expansionConf,
    narrativeCoherence: narrativeCoh,
    summaryRu: `Стабильность экосистемы ${stabilityIndex}% · когерентность нарратива ${narrativeCoh}% · confidence расширения ${expansionConf}% (не равен агрессии масштаба).`,
  };

  const expansionConfidenceExplanationRu = [
    `Расширение разрешено только когда premium perception и brand integrity держат коридор; сейчас expansion confidence = ${expansionConf}%.`,
    "Executive Intelligence питает Initiative Engine и Action Commands: при падении confidence — автоматическое смещение в consolidation / premium_defense (логика контура).",
    `Обратная связь в Temporal Strategy и Strategic Simulation: volatility ${predictive.volatilityIndex}% учтена в глобальном риске.`,
  ].join(" ");

  const longHorizonAlignmentRu = [
    "12–36 мес: noir и quiet power остаются якорем; категории растут, конституция — нет.",
    "Синхронизация Project Memory и Brand Evolution предотвращает когнитивный дрейф между запусками.",
    "Strategic Command фиксирует ценовой и семантический коридор; Execution Orchestrator — реальность DTF/FBO.",
    initiatives[0]
      ? `Инициатива «${initiatives[0]!.headlineRu.slice(0, 56)}…» встроена в executive priority, не в шум повестки.`
      : "Initiative Engine: ожидание импульса — режим наблюдения без ложного расширения.",
  ];

  const stabilityCaptionRu =
    stabilityIndex > 72
      ? "Интимидирующая ясность: контуры выровнены — имперская стабильность в пределах допуска."
      : stabilityIndex > 52
        ? "Система живая, но напряжённая: требуется дисциплина исполнения и фильтр ДНК."
        : "Фаза напряжения: executive core рекомендует recovery / premium_defense до восстановления базы.";

  return {
    generatedAt: now,
    pulseGeneration,
    regime,
    regimeExplanationRu,
    strategicContradictions,
    cognitiveConflicts,
    pressureMap,
    directives,
    stabilityIndex,
    stabilityCaptionRu,
    priorityShifts,
    riskConcentration,
    consensus,
    executiveConfidence,
    expansionConfidenceExplanationRu,
    longHorizonAlignmentRu,
    metaSignals,
  };
}
