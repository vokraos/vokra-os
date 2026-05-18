import type { VokraBrandConstitution } from "../brand-dna/types";
import type { CognitiveSynthesisState, DecisionEngineState, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type { TemporalStrategySnapshot } from "../temporal-strategy/types";
import type { SignalFabricSnapshot } from "../signal-fabric/types";
import type { ExecutionOrchestrationSnapshot } from "../execution-orchestrator/types";
import type { PredictiveEngineSnapshot } from "../predictive-engine/types";
import type { NavId } from "../../types";
import { buildFeedbackLoop } from "../feedback-loop/derive";
import { clamp, hashStr } from "../math";
import type {
  AestheticTrajectory,
  BrandEvolutionSnapshot,
  BrandRisk,
  CategoryExpansionSignal,
  DNAProtectionRule,
  EvolutionDecision,
  EvolutionVector,
  FutureDirection,
  HeritageAnchor,
} from "./types";

export type BuildBrandEvolutionInput = {
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

export function buildBrandEvolution(input: BuildBrandEvolutionInput): BrandEvolutionSnapshot {
  const now = Date.now();
  const {
    constitution: dna,
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

  const seed = hashStr(`bev-${pulseGeneration}`);
  const feedback = buildFeedbackLoop({
    orchestration: orch,
    synthesis,
    decision,
    initiatives,
    temporal,
    fabric,
    modules,
    pulseGeneration,
  });

  const dnaHold = modules.dna?.brandGate === "hold";
  const fit = dna.fitChecker;
  const foresight = predictive.foresight;
  const midScenario = predictive.scenarios[1] ?? predictive.scenarios[0]!;
  const outcome = midScenario.outcome;
  const expansionBias = predictive.expansionBias;
  const decayPressure = predictive.decayPressure;
  const brandInt = foresight.brandIntegrityForecast;
  const ctrFatigue = temporal.decay.ctrFatigue;
  const seoSat = temporal.decay.seoSaturation;

  const marketPush = fabric ? fabric.pressures.market : 44;
  const brandShell = fabric ? fabric.pressures.brand : 52;
  const dnaTension = clamp(marketPush - brandShell + Math.round((100 - fit.brandFit) * 0.25));

  const animeStyleRisk =
    expansionBias > 58 && brandInt < 62 && outcome.premiumPerception < outcome.revenuePace - 8;

  const dnaVsMarketWarningRu = animeStyleRisk
    ? "Высокий краткосрочный спрос (например, anime / viral prints), но риск размывания premium noir идентичности. Контур не принимает сигнал как стратегическую правду — только как ограниченный тест вне ядра ДНК."
    : expansionBias > 52 && brandInt < 55
      ? "Рынок тянет к быстрым визуальным победам; long-term brand value требует фильтра: не все CTR-импульсы усиливают VOKRA."
      : null;

  const currentTrajectoryRu = [
    `ДНК: ${dna.core.mantra} — ${dna.visual.pillars[0] ?? "cinematic minimalism"} удерживается как главный вектор.`,
    `Синтез контура: ${
      synthesis.regime === "saturation"
        ? "режим насыщения — эволюция смещена к защите и чистке линейки."
        : synthesis.regime === "opportunity"
          ? "окно возможности — допускается расширение при сохранении якорей."
          : "баланс давления и читабельности бренда на маркетплейсе."
    }`,
    `Simulation: brand integrity forecast ${brandInt}% · expansion bias ${expansionBias}% · premium perception ${outcome.premiumPerception}% (vs revenue pace ${outcome.revenuePace}%).`,
    `Память проектов: ${memoryProjectCount} проект(ов), ${memoryGenerationCount} генераций — плотность артефактов влияет на консистентность эволюции.`,
  ].join(" ");

  const aestheticTrajectories: AestheticTrajectory[] = [
    {
      id: "ae-noir",
      aestheticRu: "Premium noir · cinematic quiet",
      strength: clamp(58 + (seed % 18)),
      trajectoryRu:
        ctrFatigue > 54
          ? "Сильный recurring aesthetic; риск визуальной усталости — эволюция через материал и кадр, не через «крик» палитры."
          : "Устойчивый код; усиливать proof и силуэт, не декор.",
      dnaAlignment: clamp(82 + (seed % 12)),
    },
    {
      id: "ae-oversized",
      aestheticRu: "Oversized silhouette (носитель принта)",
      strength: clamp(48 + (seed % 20)),
      trajectoryRu: "Остаётся операционным базисом SKU; не смешивать с streetwear-хаосом вне рамок ДНК.",
      dnaAlignment: clamp(70 + (seed % 15)),
    },
    {
      id: "ae-street",
      aestheticRu: "Streetwear edge (контролируемый)",
      strength: clamp(32 + (seed % 22)),
      trajectoryRu:
        dnaTension > 48
          ? "Слабее как самостоятельный вектор без noir-рамки; опасен для dilution при прямом следовании тренду."
          : "Допустим как вторичный акцент при жёстком gate Brand DNA.",
      dnaAlignment: clamp(40 + (seed % 25)),
    },
  ];

  const evolutionVectors: EvolutionVector[] = [
    {
      id: "ev-narr",
      labelRu: "Нарратив: тишина → доказательство качества",
      axis: "narrative",
      magnitude: clamp(Math.round((fit.premiumSignal + outcome.brandMemory) / 2)),
      directionRu: "Длинный горизонт: меньше лозунгов, больше материала, силуэта и контроля кадра.",
      horizon: "long",
    },
    {
      id: "ev-cat",
      labelRu: "Категории: база футболки → капсулы и premium basics",
      axis: "category",
      magnitude: clamp(expansionBias + Math.round(outcome.longTailSeoMomentum * 0.15)),
      directionRu: "Расширение только при прохождении производственного контура (DTF/FBO) и SEO-опоры.",
      horizon: "mid",
    },
    {
      id: "ev-ch",
      labelRu: "Канал: карточка и SEO как защита бренда",
      axis: "channel",
      magnitude: clamp(decision.rank.seoLeverage),
      directionRu: "Краткий горизонт: CTR/SEO не должны переопределять визуальную конституцию.",
      horizon: "short",
    },
    {
      id: "ev-prod",
      labelRu: "Производство: очередь vs масштаб",
      axis: "production",
      magnitude: clamp(orch.resourcePressure.dtfQueue),
      directionRu:
        orch.resourcePressure.summaryRu.slice(0, 120) + (orch.resourcePressure.summaryRu.length > 120 ? "…" : ""),
      horizon: "mid",
    },
  ];

  const strengthen: EvolutionDecision[] = [
    {
      id: "st-1",
      stance: "evolve",
      headlineRu: "Усилить neo-noir proof: материал, свет, вес кадра",
      rationaleRu: "Повторяющаяся эстетика сильна; эволюция — не смена стиля, а углубление читаемости premium.",
      horizonBand: "180",
    },
    {
      id: "st-2",
      stance: "expand",
      headlineRu: "Лонгсливы и худи в рамках той же визуальной конституции",
      rationaleRu: `${dna.product.futureExpansion[0] ?? "Капсулы"} — из конституции; расширение без потери noir-минимализма.`,
      horizonBand: "365",
    },
  ];

  const protectRules: DNAProtectionRule[] = dna.laws.slice(0, 4).map((law, i) => ({
    id: `pr-${law.id}`,
    ruleRu: law.text,
    whatToRejectRu: dna.visual.forbidden[i] ?? dna.visual.forbidden[0] ?? "Визуальный шум и generic AI fashion",
    priority: clamp(88 - i * 6),
  }));

  const protectDecisions: EvolutionDecision[] = [
    {
      id: "pd-1",
      stance: "protect",
      headlineRu: "Защитить монохромную базу и контролируемый контраст",
      rationaleRu: "Коды из visual pillars — heritage; не размывать «спектральными» заливками ради short-term CTR.",
      horizonBand: "ongoing",
    },
    {
      id: "pd-2",
      stance: "protect",
      headlineRu: "Голос: спокойная уверенность, без marketplace-крика",
      rationaleRu: dna.voice.toneBullets[0] ?? "Тон бренда — фильтр для всех карточек и кампаний.",
      horizonBand: "ongoing",
    },
  ];

  const testDecisions: EvolutionDecision[] = [
    {
      id: "td-1",
      stance: "test",
      headlineRu: "Ограниченный тест «трендового» принта вне hero-линии",
      rationaleRu: "Изолированная волна SKU с жёстким DNA gate и cutoff по return proxy — без переноса в ядро бренда.",
      horizonBand: "90",
    },
    {
      id: "td-2",
      stance: "test",
      headlineRu: "A/B карточки: motion vs still при сохранении noir-кадра",
      rationaleRu: `Temporal: CTR fatigue ${ctrFatigue}% — тест без смены идентичности.`,
      horizonBand: "90",
    },
  ];

  const stopDecisions: EvolutionDecision[] = [
    {
      id: "kd-1",
      stance: "kill",
      headlineRu: "Снять линейки, которые ломают forbidden-ось визуала",
      rationaleRu: "Продуктовые направления с recurring слабым brand fit и высоким dilution risk — не масштабировать.",
      horizonBand: "90",
    },
    {
      id: "kd-2",
      stance: "pause",
      headlineRu: "Пауза на масштаб FBO при перегреве DTF и низком FBO readiness",
      rationaleRu: `FBO readiness ${orch.resourcePressure.fboReadiness}% · очередь DTF ${orch.resourcePressure.dtfQueue}% — long-term маржа страдает от операционного срыва.`,
      horizonBand: "180",
    },
  ];

  if (dnaHold) {
    stopDecisions[0] = {
      ...stopDecisions[0]!,
      stance: "pause",
      headlineRu: "DNA hold: остановить усиление кампаний до снятия gate",
      rationaleRu: "Brand DNA блокирует агрессивную эволюцию визуала; сначала коррекция контура.",
    };
  }

  const categorySignals: CategoryExpansionSignal[] = [
    {
      id: "cat-hoodie",
      categoryRu: "Худи / свитшоты",
      opportunity: clamp(55 + Math.round(outcome.loyaltyDepth * 0.25)),
      evidenceRu: "Конституция + simulation loyalty depth; производственный fit остаётся узким местом.",
      dnaFriction: 22,
    },
    {
      id: "cat-caps",
      categoryRu: "Кепы и аксессуары",
      opportunity: clamp(42 + (seed % 20)),
      evidenceRu: "Низкая текущая плотность в памяти — место для капсульных дропов при сохранении минимализма.",
      dnaFriction: 35,
    },
    {
      id: "cat-anime",
      categoryRu: "Anime / viral prints (рынок)",
      opportunity: clamp(48 + Math.round(marketPush * 0.35)),
      evidenceRu: "Сигнал маркетплейса может давать short-term revenue pace; friction с premium noir высокий.",
      dnaFriction: clamp(62 + (seed % 18)),
    },
  ];

  const dilutionRisks: BrandRisk[] = [
    {
      id: "risk-1",
      severity: clamp(dnaTension + (animeStyleRisk ? 12 : 0)),
      titleRu: "Размывание noir при следовании viral-эстетике",
      detailRu:
        dnaVsMarketWarningRu ??
        "Контур отслеживает расхождение между CTR-импульсом и premium perception; при росте расхождения — защита ДНК.",
      source: "feedback_loop + strategic_simulation",
      rejectBlindFollowing: true,
    },
    {
      id: "risk-2",
      severity: clamp(Math.round((outcome.saturationRisk + decayPressure) / 2)),
      titleRu: "Насыщение кластера и SEO overlap",
      detailRu: `SEO saturation ${seoSat}% · saturation risk вектор ${outcome.saturationRisk}% — расширять категории без entity-героя опасно.`,
      source: "temporal_strategy + signal_fabric",
      rejectBlindFollowing: false,
    },
    {
      id: "risk-3",
      severity: clamp(foresight.saturationProbability),
      titleRu: "Операционное расширение без FBO depth",
      detailRu: "Execution Orchestrator: масштаб без depth стока убивает long-term brand trust на маркетплейсе.",
      source: "execution_orchestrator",
      rejectBlindFollowing: false,
    },
  ];

  const heritageAnchors: HeritageAnchor[] = [
    {
      id: "h-1",
      anchorRu: dna.core.mantra,
      whyRu: "Неподвижный якорь голоса и позиционирования — все эволюции проверяются через эту строку.",
    },
    {
      id: "h-2",
      anchorRu: dna.visual.pillars[3] ?? "Quiet luxury",
      whyRu: "Наследие визуала: не обменивать на marketplace visual noise.",
    },
    {
      id: "h-3",
      anchorRu: dna.product.rules[0] ?? "Футболка — слой, не потолок",
      whyRu: "Продуктовая дисциплина масштаба: категории растут, определение бренда — нет.",
    },
  ];

  const ev0 = feedback.events[0];
  const recBullet =
    ev0?.recommendationUpdateRu != null && ev0.recommendationUpdateRu.length > 0
      ? ev0.recommendationUpdateRu.slice(0, 120) + (ev0.recommendationUpdateRu.length > 120 ? "…" : "")
      : "Синхронизировать с Feedback Loop: последняя рекомендация контура.";

  const futureDirections: FutureDirection[] = [
    {
      horizonDays: 90,
      headlineRu: "90 дней: защита ДНК, изолированные тесты, чистка слабых SKU",
      bulletsRu: [
        "Закрепить hero visual + карточку до amplification reels.",
        "Не вводить новые визуальные коды вне Brand DNA review.",
        recBullet,
      ],
    },
    {
      horizonDays: 180,
      headlineRu: "180 дней: эволюция материала и капсул без смены идентичности",
      bulletsRu: [
        "Подготовить premium basics и лонгсливы под тот же noir-коридор.",
        `Производство: держать DTF queue под контролем; FBO readiness ${orch.resourcePressure.fboReadiness}% как gate.`,
        "Strategic Command: фиксировать ценовой коридор до масштаба.",
      ],
    },
    {
      horizonDays: 365,
      headlineRu: "365 дней: территория «тихой империи» на маркетплейсах",
      bulletsRu: [
        "Расширение категорий с преемственностью нарратива и памятью проекта.",
        `Long-term: premium perception ${outcome.premiumPerception}% и exclusivity long-run ${outcome.exclusivityLongRun}% — дорожная карта, не quarterly hype.`,
        "Mission Control: каждый крупный запуск проходит эволюционный фильтр.",
      ],
    },
  ];

  const shortVsLongRu = [
    "Краткосрочные победы маркетплейса (CTR, viral print, discount window) учитываются как сигнал исполнения, не как смена конституции бренда.",
    "Долгосрочная ценность: узнаваемость noir / quiet power, доверие к материалу и силуэту, маржа и FBO-дисциплина — приоритет контура VOKRA OS.",
    "Signal Fabric и Temporal дают давление рынка во времени; Brand Evolution Engine отсекает то, что может dilute DNA.",
  ];

  return {
    generatedAt: now,
    pulseGeneration,
    currentTrajectoryRu,
    aestheticTrajectories,
    evolutionVectors,
    strengthen,
    protectRules,
    protectDecisions,
    testDecisions,
    stopDecisions,
    categorySignals,
    dilutionRisks,
    heritageAnchors,
    futureDirections,
    shortVsLongRu,
    dnaVsMarketWarningRu,
  };
}
