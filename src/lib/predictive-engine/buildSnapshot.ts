import type { NavId } from "../../types";
import type {
  ExecutiveForesightMetrics,
  MarketPressureSignal,
  PredictiveEngineInputs,
  PredictiveEngineSnapshot,
  ProbabilityFieldLayer,
  ResourceImpactForecast,
  ScenarioBranch,
  ScenarioOutcomeVector,
  TimeHorizonId,
} from "./types";
import type { ModuleCognitiveSnapshot } from "../cognitive-os/types";
import { readSelfEvolvingSyncAdjustments } from "../self-evolving-strategy/reactivity";
import { clamp, hashStr } from "../math";

function jitter(seed: number, i: number, spread = 18): number {
  const h = hashStr(`${seed}-${i}`);
  return ((h % 1000) / 1000 - 0.5) * spread;
}

function avgPressure(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>): number {
  const vals = Object.values(modules)
    .map((m) => m?.pressure)
    .filter((v): v is number => v != null);
  if (!vals.length) return 44;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function opsPressure(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>): number {
  return modules.operations?.pressure ?? modules.operationsBrief?.pressure ?? 40;
}

function horizonWeights(h: TimeHorizonId): {
  short: number;
  mid: number;
  long: number;
  seasonal: number;
  seo: number;
} {
  switch (h) {
    case "d7":
      return { short: 1, mid: 0.35, long: 0.12, seasonal: 0.2, seo: 0.25 };
    case "d30":
      return { short: 0.55, mid: 1, long: 0.45, seasonal: 0.55, seo: 0.65 };
    case "d90":
      return { short: 0.25, mid: 0.75, long: 1, seasonal: 0.85, seo: 0.95 };
    case "seasonal":
      return { short: 0.4, mid: 0.85, long: 0.9, seasonal: 1, seo: 0.7 };
    case "longTail":
    default:
      return { short: 0.15, mid: 0.4, long: 0.95, seasonal: 0.6, seo: 1 };
  }
}

function buildScenarioA(seed: number, w: ReturnType<typeof horizonWeights>): ScenarioBranch {
  const outcome: ScenarioOutcomeVector = {
    revenuePace: clamp(78 + jitter(seed, 1) * w.short),
    saturationRisk: clamp(52 + jitter(seed, 2) * w.mid),
    brandMemory: clamp(38 + jitter(seed, 3)),
    loyaltyDepth: clamp(40 + jitter(seed, 4)),
    ctrErosion: clamp(48 + jitter(seed, 5) * w.short),
    longTailSeoMomentum: clamp(42 + jitter(seed, 6) * w.seo),
    premiumPerception: clamp(55 + jitter(seed, 7)),
    exclusivityLongRun: clamp(32 + jitter(seed, 8) * w.long),
  };
  return {
    id: "A",
    nameRu: "Быстрый DTF-запуск",
    nameEn: "Fast DTF launch",
    thesisRu: "Максимальная скорость выручки при умеренном риске насыщения и слабее долгосрочной эксклюзивности.",
    thesisEn: "Maximum revenue velocity with medium saturation risk and weaker long-run exclusivity.",
    consequenceChainRu: [
      "Рынок: быстрый отклик на герое",
      "Тренд: ускорение до локального перегрева",
      "SKU: короткий жизненный цикл proof",
      "CTR: рост, затем типичный спад без motion-подкрепа",
    ],
    consequenceChainEn: [
      "Market: fast hero response",
      "Trend: acceleration toward local overheating",
      "SKU: short proof lifecycle",
      "CTR: lift, then typical decay without motion support",
    ],
    outcome,
    trajectory: [0.12, 0.42, 0.78, 0.65, 0.38].map((v, i) => clamp(v + jitter(seed, 10 + i) * 0.06, 0, 1)),
    probabilityMass: clamp(0.34 + jitter(seed, 20) * 0.004, 0.22, 0.44),
  };
}

function buildScenarioB(seed: number, w: ReturnType<typeof horizonWeights>): ScenarioBranch {
  const outcome: ScenarioOutcomeVector = {
    revenuePace: clamp(44 + jitter(seed, 30) * w.short),
    saturationRisk: clamp(28 + jitter(seed, 31)),
    brandMemory: clamp(72 + jitter(seed, 32) * w.long),
    loyaltyDepth: clamp(68 + jitter(seed, 33) * w.mid),
    ctrErosion: clamp(22 + jitter(seed, 34)),
    longTailSeoMomentum: clamp(58 + jitter(seed, 35) * w.seo),
    premiumPerception: clamp(80 + jitter(seed, 36)),
    exclusivityLongRun: clamp(74 + jitter(seed, 37) * w.long),
  };
  return {
    id: "B",
    nameRu: "Премиальная лимитированная капсула",
    nameEn: "Premium limited capsule",
    thesisRu: "Медленнее масштаб, сильнее память бренда и лояльность; ниже вероятность насыщения витрины.",
    thesisEn: "Slower scale, stronger brand memory and loyalty; lower saturation probability on-shelf.",
    consequenceChainRu: [
      "Позиционирование: укрепление премиального якоря",
      "Эмоция: более длинное окно новизны",
      "SEO: entity-глубина вместо ширины кластера",
      "Операции: контролируемая партия, меньше FBO-волатильности",
    ],
    consequenceChainEn: [
      "Positioning: premium anchor reinforcement",
      "Emotion: longer novelty window",
      "SEO: entity depth over cluster width",
      "Operations: controlled batch, lower FBO volatility",
    ],
    outcome,
    trajectory: [0.18, 0.28, 0.36, 0.52, 0.68].map((v, i) => clamp(v + jitter(seed, 40 + i) * 0.05, 0, 1)),
    probabilityMass: clamp(0.36 + jitter(seed, 50) * 0.003, 0.28, 0.48),
  };
}

function buildScenarioC(seed: number, w: ReturnType<typeof horizonWeights>): ScenarioBranch {
  const outcome: ScenarioOutcomeVector = {
    revenuePace: clamp(70 + jitter(seed, 60) * w.short),
    saturationRisk: clamp(62 + jitter(seed, 61) * w.mid),
    brandMemory: clamp(36 + jitter(seed, 62)),
    loyaltyDepth: clamp(34 + jitter(seed, 63)),
    ctrErosion: clamp(68 + jitter(seed, 64) * w.short),
    longTailSeoMomentum: clamp(48 + jitter(seed, 65)),
    premiumPerception: clamp(40 + jitter(seed, 66)),
    exclusivityLongRun: clamp(28 + jitter(seed, 67)),
  };
  return {
    id: "C",
    nameRu: "Масштаб только через маркетплейс",
    nameEn: "Marketplace-only scaling",
    thesisRu: "Высокий краткосрочный трафик при росте визуальной усталости и эрозии CTR.",
    thesisEn: "High short-term traffic with rising visual fatigue and CTR erosion.",
    consequenceChainRu: [
      "Трафик: пик видимости в промо-окне",
      "Визуал: ускоренная фатигированность шаблонов",
      "Конкуренты: выше вероятность зеркальной реакции цены",
      "Маржа: давление mid-price якорей",
    ],
    consequenceChainEn: [
      "Traffic: visibility peak in promo window",
      "Visual: faster template fatigue",
      "Competitors: higher likelihood of price mirroring",
      "Margin: mid-price anchor pressure",
    ],
    outcome,
    trajectory: [0.22, 0.58, 0.82, 0.48, 0.22].map((v, i) => clamp(v + jitter(seed, 70 + i) * 0.06, 0, 1)),
    probabilityMass: clamp(0.28 + jitter(seed, 80) * 0.003, 0.18, 0.38),
  };
}

function buildForesight(
  seed: number,
  d: PredictiveEngineInputs["decision"],
  s: PredictiveEngineInputs["synthesis"],
  w: ReturnType<typeof horizonWeights>,
): ExecutiveForesightMetrics {
  const baseSat = d.riskSaturationProb;
  const baseCtr = d.riskCtrFatigue;
  const baseProd = d.riskProductionOverload;
  const baseDil = d.riskBrandDilution;

  return {
    futureRiskHorizon: clamp(
      Math.round(baseSat * 0.35 + baseCtr * 0.25 + baseProd * 0.2 + jitter(seed, 90)),
    ),
    momentumStability: clamp(Math.round(100 - baseCtr * 0.45 - jitter(seed, 91) * 0.3)),
    opportunityHalfLife: clamp(Math.round(62 - baseSat * 0.25 + w.long * 22 + jitter(seed, 92))),
    brandIntegrityForecast: clamp(Math.round(88 - baseDil * 0.85 + jitter(seed, 93))),
    saturationProbability: clamp(Math.round(baseSat * 0.55 + s.pressureIndex * 0.35 + jitter(seed, 94))),
    emotionalRetentionWindow: clamp(Math.round(72 - baseCtr * 0.4 + w.mid * 18 + jitter(seed, 95))),
    launchSurvivability: clamp(Math.round(s.launchReadiness * 0.72 + (100 - baseProd) * 0.22 + jitter(seed, 96))),
    longTermMarginStability: clamp(
      Math.round(d.rank.marginPotential * 0.55 + (100 - d.riskPricingPressure) * 0.35 + jitter(seed, 97)),
    ),
  };
}

function buildResourceImpact(
  seed: number,
  d: PredictiveEngineInputs["decision"],
  regime: string,
  pOps: number,
  w: ReturnType<typeof horizonWeights>,
): ResourceImpactForecast {
  const prodBoost = regime === "production_load" ? 22 : 0;
  return {
    dtfQueueLoad: clamp(Math.round(d.riskProductionOverload * 0.85 + prodBoost + jitter(seed, 100))),
    fboPressure: clamp(Math.round(pOps * 0.72 + d.riskProductionOverload * 0.35 + jitter(seed, 101))),
    packagingBottleneck: clamp(Math.round(32 + prodBoost * 0.6 + jitter(seed, 102))),
    contentProductionStrain: clamp(Math.round(38 + (100 - w.short * 30) * 0.25 + jitter(seed, 103))),
    skuManagementComplexity: clamp(Math.round(40 + d.rank.strategic * 0.15 + jitter(seed, 104))),
    summaryRu:
      regime === "production_load"
        ? "Прогноз: очередь DTF и FBO выходят в жёсткую фазу при параллельном запуске; капсула снижает пик."
        : "Прогноз: ресурсный контур выдерживает один сильный вход; второй вход сдвигает узкое место в упаковку и контент.",
    summaryEn:
      regime === "production_load"
        ? "Forecast: DTF queue and FBO enter a hard phase under parallel launch; capsule lowers the peak."
        : "Forecast: ops absorb one strong launch; a second shifts bottlenecks to packaging and content.",
  };
}

function buildMarketPressure(seed: number, regime: string, w: ReturnType<typeof horizonWeights>): MarketPressureSignal[] {
  const niche = clamp(Math.round(42 + (regime === "saturation" ? 28 : 0) + w.mid * 22 + jitter(seed, 110)));
  const fatigue = clamp(Math.round(36 + jitter(seed, 111) + w.short * 24));
  const ctr = clamp(Math.round(40 + jitter(seed, 112) + w.short * 28));
  const novelty = clamp(Math.round(64 - w.long * 18 + jitter(seed, 113)));
  const comp = clamp(Math.round(38 + w.mid * 20 + jitter(seed, 114)));
  const prem = clamp(Math.round(48 + (regime === "opportunity" ? -12 : 8) + jitter(seed, 115)));

  return [
    {
      id: "niche",
      labelRu: "Перегрев ниши",
      labelEn: "Niche overheating",
      intensity: niche,
      windowRu: w.long > 0.85 ? "30–90 дн." : "7–21 дн.",
      windowEn: w.long > 0.85 ? "30–90d" : "7–21d",
    },
    {
      id: "visual",
      labelRu: "Визуальная усталость",
      labelEn: "Visual fatigue",
      intensity: fatigue,
      windowRu: "14–45 дн.",
      windowEn: "14–45d",
    },
    {
      id: "ctr",
      labelRu: "Коллапс CTR",
      labelEn: "CTR collapse risk",
      intensity: ctr,
      windowRu: "10–40 дн.",
      windowEn: "10–40d",
    },
    {
      id: "novelty",
      labelRu: "Ослабление новизны",
      labelEn: "Emotional novelty decay",
      intensity: 100 - novelty,
      windowRu: "21–60 дн.",
      windowEn: "21–60d",
    },
    {
      id: "competitor",
      labelRu: "Реакция конкурентов",
      labelEn: "Competitor reaction",
      intensity: comp,
      windowRu: "7–30 дн.",
      windowEn: "7–30d",
    },
    {
      id: "premium",
      labelRu: "Эрозия премиум-восприятия",
      labelEn: "Premium perception erosion",
      intensity: prem,
      windowRu: "45–120 дн.",
      windowEn: "45–120d",
    },
  ];
}

function buildLayers(seed: number, regime: string): ProbabilityFieldLayer[] {
  const h = hashStr(`layers-${seed}-${regime}`) % 360;
  return [
    { id: "momentum", labelRu: "Импульс", labelEn: "Momentum", weight: 0.28, hue: (h + 20) % 360 },
    { id: "decay", labelRu: "Декей сигнала", labelEn: "Signal decay", weight: 0.22, hue: (h + 140) % 360 },
    { id: "expansion", labelRu: "Расширение охвата", labelEn: "Reach expansion", weight: 0.2, hue: (h + 220) % 360 },
    { id: "volatility", labelRu: "Волатильность", labelEn: "Volatility", weight: 0.18, hue: (h + 280) % 360 },
    { id: "memory", labelRu: "Память бренда", labelEn: "Brand memory", weight: 0.12, hue: (h + 320) % 360 },
  ];
}

function normalizeMass(scenarios: ScenarioBranch[]): ScenarioBranch[] {
  const sum = scenarios.reduce((a, b) => a + b.probabilityMass, 0);
  return scenarios.map((s) => ({
    ...s,
    probabilityMass: s.probabilityMass / sum,
  }));
}

export function buildPredictiveSnapshot(
  inputs: PredictiveEngineInputs,
  horizon: TimeHorizonId,
): PredictiveEngineSnapshot {
  const { synthesis, decision, modules, pulseGeneration, fabric } = inputs;
  const seed = hashStr(`${synthesis.regime}-${pulseGeneration}-${horizon}-${decision.priorityHeadlineRu.slice(0, 24)}`);
  const w = horizonWeights(horizon);
  const p = avgPressure(modules);
  const pOps = opsPressure(modules);

  const scenarios = normalizeMass([
    buildScenarioA(seed, w),
    buildScenarioB(seed, w),
    buildScenarioC(seed, w),
  ]);

  const foresight = buildForesight(seed, decision, synthesis, w);
  const resourceImpact = buildResourceImpact(seed, decision, synthesis.regime, pOps, w);
  const marketPressure = buildMarketPressure(seed, synthesis.regime, w);
  const probabilityLayers = buildLayers(seed, synthesis.regime);

  const serious = fabric?.conflicts.filter((c) => c.id !== "cf-nominal") ?? [];
  const fabricStress = serious.length ? Math.round(serious.reduce((a, c) => a + c.severity, 0) / serious.length) : 0;

  const volatilityIndex = clamp(
    Math.round(
      p * 0.55 + decision.riskCtrFatigue * 0.25 + jitter(seed, 200) + fabricStress * 0.12 + readSelfEvolvingSyncAdjustments().simulationVolatilityBias,
    ),
  );
  const signalLongevity = clamp(Math.round(58 + w.long * 32 - decision.riskCtrFatigue * 0.35 + jitter(seed, 201)));
  const expansionBias = clamp(Math.round(synthesis.launchReadiness * 0.45 + (regimeWeights(synthesis.regime) ? 12 : 0) + jitter(seed, 202)));
  const decayPressure = clamp(
    Math.round(
      decision.riskCtrFatigue * 0.4 + decision.riskSaturationProb * 0.35 + jitter(seed, 203) + fabricStress * 0.15,
    ),
  );

  const adaptiveMemoryRu = [
    decision.executiveMemoryRu,
    synthesis.memoryEchoRu,
    `Калибровка: режим «${synthesis.regime}» · давление контура ${Math.round(p)}%`,
    ...(fabric
      ? [
          `Сигнальная сеть: каскадное давление ${fabric.cascades[0]?.headIntensity ?? 0}% · ядро ${fabric.corePressure}%.`,
        ]
      : []),
  ];
  const adaptiveMemoryEn = [
    "Calibrated from executive trace and prior launch outcomes.",
    "Seasonal and CTR curves inform half-life estimates.",
    `Contour regime «${synthesis.regime}» · aggregate pressure ${Math.round(p)}%`,
    ...(fabric ? ["Signal fabric: cascade pressure folded into scenario branches."] : []),
  ];

  return {
    horizon,
    volatilityIndex,
    signalLongevity,
    expansionBias,
    decayPressure,
    scenarios,
    foresight,
    resourceImpact,
    marketPressure,
    probabilityLayers,
    adaptiveMemoryRu,
    adaptiveMemoryEn,
    pulseGeneration,
  };
}

function regimeWeights(regime: string): boolean {
  return regime === "opportunity";
}
