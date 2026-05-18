import type { PredictiveEngineSnapshot, ScenarioOutcomeVector } from "../predictive-engine/types";
import { buildExecutiveIntelligence, type BuildExecutiveIntelligenceInput } from "../executive-intelligence/derive";
import { readSelfEvolvingSyncAdjustments } from "../self-evolving-strategy/reactivity";
import { clamp, hashStr } from "../math";
import type {
  AttentionAllocation,
  BurnoutRisk,
  CognitiveLoad,
  ExecutionFatigue,
  ExpansionCapacity,
  GrowthPressure,
  OperationalStress,
  OrganismState,
  ResourceFlow,
  StabilityIndex,
  StrategicEnergy,
  SystemHealth,
} from "./types";

export type BuildOrganismModelInput = BuildExecutiveIntelligenceInput;

export function buildOrganismModel(input: BuildOrganismModelInput): OrganismState {
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

  const seed = hashStr(`org-${pulseGeneration}`);
  const exec = buildExecutiveIntelligence(input);
  const mid = predictive.scenarios[1] ?? predictive.scenarios[0]!;
  const out = mid.outcome;
  const rp = orch.resourcePressure;
  const dtf = rp.dtfQueue;
  const fbo = rp.fboReadiness;
  const content = rp.contentLoad;
  const seoLev = decision.rank.seoLeverage;
  const prodFit = decision.rank.productionFit;
  const ctrF = temporal.decay.ctrFatigue;
  const visF = temporal.decay.visualFatigue;
  const seoSat = temporal.decay.seoSaturation;
  const marketP = fabric?.pressures.market ?? 48;
  const brandP = fabric?.pressures.brand ?? 52;

  const productionHealth = clamp(Math.round(prodFit * 0.45 + (100 - dtf) * 0.35 + fbo * 0.2));
  const launchHealth = clamp(synthesis.launchReadiness - Math.round(orch.operationalDrag * 0.15));
  const contentHealth = clamp(100 - content - Math.round(decision.riskCtrFatigue * 0.12));
  const seoHealth = clamp(Math.round(seoLev * 0.55 + (100 - seoSat) * 0.45 - ctrF * 0.15));
  const marketplaceHealth = clamp(Math.round((100 - marketP) * 0.4 + brandP * 0.35 + (100 - decision.riskPricingPressure) * 0.25));
  const premiumHealth = clamp(out.premiumPerception - Math.round(decision.riskBrandDilution * 0.2));
  const narrativeHealth = clamp(Math.round(out.brandMemory * 0.5 + foresightMomentum(predictive) * 0.5));
  const executionHealth = clamp(orch.executionConfidence - Math.round(orch.operationalDrag * 0.2));

  const axes: SystemHealth["axes"] = [
    { axis: "production", labelRu: "Производство", score: productionHealth, pulseRu: `DTF ${dtf}% · FBO readiness ${fbo}%` },
    { axis: "launch", labelRu: "Запуски", score: launchHealth, pulseRu: synthesis.activeMissionRu.slice(0, 72) },
    { axis: "content", labelRu: "Контент", score: contentHealth, pulseRu: `Нагрузка контента ${content}% · fatigue CTR ${ctrF}%` },
    { axis: "seo", labelRu: "SEO", score: seoHealth, pulseRu: `Leverage ${seoLev}% · saturation ${seoSat}%` },
    { axis: "marketplace", labelRu: "Маркетплейс", score: marketplaceHealth, pulseRu: "WB / Ozon давление vs бренд-оболочка контура." },
    { axis: "premium_perception", labelRu: "Premium perception", score: premiumHealth, pulseRu: `Simulation vector · exclusivity ${out.exclusivityLongRun}%` },
    { axis: "narrative", labelRu: "Нарратив", score: narrativeHealth, pulseRu: synthesis.memoryEchoRu.slice(0, 80) },
    { axis: "execution", labelRu: "Исполнение", score: executionHealth, pulseRu: orch.nextBestActionRu.slice(0, 80) },
  ];

  const overall = clamp(Math.round(axes.reduce((s, a) => s + a.score, 0) / axes.length));

  const stressIdx = clamp(
    Math.round(
      dtf * 0.22 +
        content * 0.18 +
        ctrF * 0.15 +
        visF * 0.12 +
        predictive.decayPressure * 0.18 +
        orch.operationalDrag * 0.15 +
        readSelfEvolvingSyncAdjustments().organismStressBias,
    ),
  );

  const growthIdx = clamp(Math.round(predictive.expansionBias * 0.35 + decision.rank.speedPotential * 0.25 + (100 - satBlend(predictive)) * 0.2));

  const cogLoad = clamp(
    Math.round(memoryDensity(memoryGenerationCount) * 0.25 + initiatives.length * 8 + content * 0.2 + decision.riskSaturationProb * 0.2),
  );

  const narrativeCoh = clamp(Math.round(out.brandMemory * 0.55 + (100 - decision.riskBrandDilution) * 0.45));

  const flows: ResourceFlow[] = normalizeFlows([
    { id: "fl-att", channelRu: "Внимание (стратегический фокус)", share: 22 + (seed % 12), stateRu: "Распределение между hero SKU и long-tail." },
    { id: "fl-prod", channelRu: "Производство / DTF", share: 18 + Math.round(dtf * 0.12), stateRu: rp.summaryRu.slice(0, 90) },
    { id: "fl-creative", channelRu: "Креативная энергия", share: 16 + Math.round(visF * 0.1), stateRu: "Визуал, reels, кампании — общий котёл." },
    { id: "fl-ex", channelRu: "Исполнительная ёмкость", share: 20 + Math.round(orch.operationalDrag * 0.08), stateRu: "Оркестратор и командный слой." },
    { id: "fl-mkt", channelRu: "Маркетинговое давление", share: 14 + Math.round(marketP * 0.1), stateRu: "WB / Ozon и promo pressure." },
  ]);

  const attentionAllocation: AttentionAllocation = {
    summaryRu: `Горячие точки: ${exec.metaSignals[0]?.source ?? "Mission Control"} и ${exec.metaSignals[2]?.source ?? "Temporal"} тянут внимание; риск размытия ${clamp(30 + Math.round(cogLoad * 0.35))}%.`,
    hotspotsRu: [
      synthesis.topOpportunityRu.slice(0, 88) + (synthesis.topOpportunityRu.length > 88 ? "…" : ""),
      decision.priorityHeadlineRu.slice(0, 88) + (decision.priorityHeadlineRu.length > 88 ? "…" : ""),
    ],
    dilutionRisk: clamp(28 + Math.round((decision.rank.speedPotential - out.premiumPerception) * 0.25)),
  };

  const overloadSignalsRu: string[] = [
    initiatives.length > 4 ? "Слишком много параллельных инициатив — организм теряет единый ритм запусков." : null,
    memoryGenerationCount > 120 ? "SKU / артефактная энтропия в памяти: риск explosion линейки без hero-якоря." : null,
    ctrF > 56 && visF > 52 ? "Content fatigue: CTR и визуальная усталость одновременно." : null,
    dtf > 62 ? "Production congestion: очередь DTF перегревает исполнительный слой." : null,
    seoSat > 58 && seoLev > 60 ? "SEO expansion без фокуса — слабая когерентность кластера." : null,
    decision.riskBrandDilution > 55 ? "Размытый нарратив относительно premium позиционирования." : null,
    synthesis.pressureIndex > 68 ? "Системный stress: индекс давления синтеза высокий." : null,
  ].filter((x): x is string => Boolean(x));

  if (overloadSignalsRu.length === 0) {
    overloadSignalsRu.push("Перегруз: сигналы умеренные — держать дисциплину фокуса и мониторинг Signal Fabric.");
  }

  const underutilizationRu: string[] = [
    dtf < 38 && fbo > 55 ? "Idle production headroom: DTF не заполнен — можно аккуратно нарастить капсулы в hero-кластере." : null,
    seoLev < 44 && seoSat < 42 ? "Слабая эксплуатация SEO: long-tail и карточка WB/Ozon недозагружены." : null,
    out.premiumPerception > 72 && decision.riskPricingPressure < 42 ? "Underused premium positioning: ценовой коридор допускает усиление без promo-агрессии." : null,
    memoryGenerationCount < 12 ? "Мало артефактов в памяти — слабая петля обучения контура." : null,
  ].filter((x): x is string => Boolean(x));

  if (underutilizationRu.length === 0) {
    underutilizationRu.push("Недозагруз: маржа фокуса на hero и narrative — без распыления SKU.");
  }

  const lossZonesRu = [
    "Зона потерь: внимание утекает в long-tail без proof-слоя — premium ощущение не закрепляется.",
    `Зона потерь: операционный drag ${orch.operationalDrag}% съедает launch health при неизменном FBO readiness.`,
    "Зона потерь: маркетинговое давление без синхронизации с Brand DNA — короткий CTR, длинный brand memory страдает.",
  ];

  const resilience = clamp(
    Math.round(exec.executiveConfidence.ecosystemStability * 0.4 + (100 - stressIdx) * 0.35 + narrativeCoh * 0.25),
  );

  const expansionCap = computeExpansionCapacity(dtf, fbo, stressIdx, out, predictive.expansionBias);

  const burnout: BurnoutRisk = {
    index: clamp(stressIdx + Math.round(cogLoad * 0.25)),
    factorsRu: overloadSignalsRu.slice(0, 4),
    captionRu:
      stressIdx > 62
        ? "Риск перегрева: организм близок к неконтролируемому расширению без recovery окна."
        : "Перегрев в коридоре — допускается рост только с executive filter.",
  };

  const stratEnergy: StrategicEnergy = {
    reserve: clamp(Math.round(exec.executiveConfidence.narrativeCoherence * 0.5 + brandP * 0.3 + (100 - stressIdx) * 0.2)),
    spendRateRu: `Расход стратегической энергии привязан к volatility ${predictive.volatilityIndex}% и campaign pressure ${rp.campaignPressure}%.`,
    recoveryWindowRu: temporal.bestLaunchWindowRu.slice(0, 100) + (temporal.bestLaunchWindowRu.length > 100 ? "…" : ""),
  };

  const execFatigue: ExecutionFatigue = {
    index: clamp(Math.round(orch.operationalDrag * 0.45 + dtf * 0.25 + content * 0.2 + ctrF * 0.1)),
    sourcesRu: [
      `Маршруты: ${orch.routes.length} · confidence исполнения ${orch.executionConfidence}%`,
      `Командный слой: ${orch.actionCommandLayer.commands.length} команд в контуре.`,
    ],
    reliefRu: "Снять параллельные волны, зафиксировать FBO gate, перенести creative на proof-слой.",
  };

  const loadMapRu = exec.pressureMap.cells.map((c) => ({
    zoneRu: c.axisRu,
    load: c.value,
    noteRu: c.noteRu,
  }));

  const stabilityValue = clamp(Math.round(overall * 0.45 + resilience * 0.35 + (100 - burnout.index) * 0.2));
  const stabilityIndex: StabilityIndex = {
    value: stabilityValue,
    interpretationRu:
      stabilityValue > 72
        ? "Высокая общая стабильность: физиология организма выдерживает текущий рост."
        : stabilityValue > 52
          ? "Умеренная стабильность: рост возможен только дисциплинированно."
          : "Низкая стабильность: приоритет recovery и консолидация до новых волн.",
  };

  const systemSummaryRu = [
    `Организм VOKRA: давление ${synthesis.pressureIndex}% · готовность к запуску ${synthesis.launchReadiness}% · режим рынка ${synthesis.regime}.`,
    `Executive Intelligence stability ${exec.stabilityIndex}% согласована с organism stability ${stabilityValue}%.`,
    `Память: ${memoryProjectCount} проект(ов), ${memoryGenerationCount} генераций — плотность нервной ткани контура.`,
    constitution.core.mantra ? `ДНК-якорь: ${constitution.core.mantra}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const brandEnergyRu = `Энергия бренда: premium signal конституции ${constitution.fitChecker.premiumSignal}% · alignment с simulation premium perception ${out.premiumPerception}% · gate ${modules.dna?.brandGate ?? "ok"}.`;

  const growthPressure: GrowthPressure = {
    index: growthIdx,
    vectorRu: `Вектор роста: expansion bias ${predictive.expansionBias}% против operational stress ${stressIdx}%.`,
    safeGrowthRu: expansionCap.verdictRu,
  };

  const cognitiveLoad: CognitiveLoad = {
    index: cogLoad,
    narrativeCoherence: narrativeCoh,
    focusRu: decision.executiveReasoningRu.slice(0, 140) + (decision.executiveReasoningRu.length > 140 ? "…" : ""),
  };

  const operationalStress: OperationalStress = {
    index: stressIdx,
    summaryRu: `Системный stress ${stressIdx}%: производство, контент и маркетплейс тянут исполнительный слой.`,
    driversRu: overloadSignalsRu.slice(0, 5),
  };

  const integrationTies = [
    {
      id: "executive_intelligence",
      layerRu: "Executive Intelligence",
      tieRu: `Снимок стабильности ${exec.stabilityIndex}% и режим ${exec.regime} — скелет executive alignment организма.`,
    },
    {
      id: "execution_orchestrator",
      layerRu: "Execution Orchestrator",
      tieRu: `Операционный drag ${orch.operationalDrag}% и confidence ${orch.executionConfidence}% кормят execution fatigue и launch health.`,
    },
    {
      id: "signal_fabric",
      layerRu: "Signal Fabric",
      tieRu: `Рыночное давление ${marketP}% и brand pressure ${brandP}% — периферийная нервная система нагрузки.`,
    },
    {
      id: "feedback_loop",
      layerRu: "Feedback Loop",
      tieRu: "Замкнутые сигналы CTR и визуальной усталости снижают риск слепого роста SKU.",
    },
    {
      id: "brand_evolution",
      layerRu: "Brand Evolution",
      tieRu: "Траектория бренда и DNA gate ограничивают narrative dilution при расширении линейки.",
    },
    {
      id: "temporal_strategy",
      layerRu: "Temporal Strategy",
      tieRu: "Decay слой (CTR fatigue, SEO saturation) задаёт recovery window для strategic energy.",
    },
    {
      id: "strategic_simulation",
      layerRu: "Strategic Simulation",
      tieRu: `Premium perception ${out.premiumPerception}% и brand memory ${out.brandMemory}% — физиология premium health.`,
    },
    {
      id: "project_memory",
      layerRu: "Project Memory",
      tieRu: `Плотность памяти ${memoryGenerationCount} генераций / ${memoryProjectCount} проектов — когнитивная масса контура.`,
    },
  ] as const;

  return {
    generatedAt: now,
    pulseGeneration,
    integrationTies,
    systemSummaryRu,
    systemHealth: { overall, axes },
    loadMapRu,
    operationalStress,
    resourceFlows: flows,
    attentionAllocation,
    strategicEnergy: stratEnergy,
    brandEnergyRu,
    overheatingRisk: burnout,
    growthResilience: resilience,
    growthPressure,
    cognitiveLoad,
    executionFatigue: execFatigue,
    lossZonesRu,
    expansionCapacity: expansionCap,
    underutilizationRu,
    overloadSignalsRu,
    stabilityIndex,
    stabilityNarrativeRu: exec.stabilityCaptionRu + " " + stabilityIndex.interpretationRu,
    executiveAlignmentRu: `Синхрон с Executive Intelligence: режим ${exec.regime} · expansion confidence ${exec.executiveConfidence.expansionConfidence}%.`,
  };
}

function foresightMomentum(p: PredictiveEngineSnapshot): number {
  return p.foresight.momentumStability;
}

function satBlend(p: PredictiveEngineSnapshot): number {
  return p.foresight.saturationProbability;
}

function memoryDensity(gens: number): number {
  return clamp(Math.min(100, gens / 2));
}

function normalizeFlows(rows: ResourceFlow[]): ResourceFlow[] {
  const sum = rows.reduce((s, r) => s + r.share, 0) || 1;
  return rows.map((r) => ({ ...r, share: clamp(Math.round((r.share / sum) * 100)) }));
}

function computeExpansionCapacity(
  dtf: number,
  fbo: number,
  stress: number,
  out: ScenarioOutcomeVector,
  expansionBias: number,
): ExpansionCapacity {
  const base = clamp(72 - Math.round(dtf * 0.35) - Math.round(stress * 0.2) + Math.round(fbo * 0.15));
  const sku = clamp(base - 8 + (expansionBias > 58 ? -10 : 4));
  const cat = clamp(base - 4 - (out.saturationRisk > 55 ? 12 : 0));
  const fboC = clamp(fbo - 6 - Math.round(dtf * 0.12));
  const cap = clamp(base - 2);
  const niche = clamp(base - 18);
  const verdict =
    base > 58
      ? "Организм может безопасно наращивать hero SKU и капсулы при контроле DTF и FBO."
      : base > 42
        ? "Расширение только точечно: hero-кластер, без category explosion и без параллельных FBO волн."
        : "Масштаб SKU, FBO и ниши — стоп до recovery; капсулы только как изолированный тест.";
  return {
    index: base,
    skuScale: sku,
    categoryExpand: cat,
    fboIncrease: fboC,
    capsules: cap,
    newNiches: niche,
    verdictRu: verdict,
  };
}
