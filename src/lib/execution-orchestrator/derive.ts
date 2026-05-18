import type { NavId } from "../../types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type { CognitiveSynthesisState, DecisionEngineState, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import type { TemporalStrategySnapshot } from "../temporal-strategy/types";
import type { SignalFabricSnapshot } from "../signal-fabric/types";
import type { PredictiveEngineSnapshot } from "../predictive-engine/types";
import type {
  Blocker,
  DependencyEdge,
  DependencyGraph,
  ExecutionOrchestrationSnapshot,
  ExecutionRoute,
  ExecutionRouteKind,
  ExecutionStage,
  ExecutionTask,
  LaunchSequence,
  OrchestratorSystem,
  ResourcePressure,
  RouteState,
} from "./types";
import { ROUTE_KIND_LABEL_RU, SYSTEM_LABEL_RU } from "./types";
import { buildActionCommands } from "../action-command/derive";
import { readSelfEvolvingSyncAdjustments } from "../self-evolving-strategy/reactivity";
import { clamp, hashStr } from "../math";

function modP(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>, id: NavId): number {
  return modules[id]?.pressure ?? 40;
}

const STAGE_NAMES_PREMIUM = [
  "Валидация сигналов",
  "Проверка Brand DNA",
  "Архитектура SKU",
  "Генерация принт-концепта",
  "Производство hero-визуала",
  "Настройка SEO-кластера",
  "Rich-контент",
  "Деплой на маркетплейс (WB / Ozon)",
  "Реклама / усиление Reels",
  "Расширение FBO",
  "Мониторинг performance",
  "Решение: refresh или scale",
] as const;

const OWNERS_CYCLE: OrchestratorSystem[] = [
  "trend_radar",
  "brand_dna",
  "command",
  "visual",
  "visual",
  "seo",
  "signal_fabric",
  "mission_control",
  "campaign",
  "production",
  "strategic_simulation",
  "temporal_strategy",
];

function stageState(idx: number, seed: number, blocked: boolean): RouteState {
  if (blocked && idx >= 7) return idx === 8 ? "blocked" : "waiting";
  if (idx < 2) return "synchronized";
  if (idx === 2 || idx === 3) return "active";
  if (idx === 4) return "production_ready";
  if (idx < 8) return "waiting";
  if (idx === 8) return "scaling";
  if (idx === 9) return (seed + idx) % 5 === 0 ? "paused" : "active";
  return (seed + idx) % 7 === 0 ? "completed" : "waiting";
}

function buildSequence(routeId: string, seed: number, blocked: boolean): LaunchSequence {
  const stages: ExecutionStage[] = [];
  for (let i = 0; i < STAGE_NAMES_PREMIUM.length; i++) {
    const owner = OWNERS_CYCLE[i] ?? "mission_control";
    const st = stageState(i, seed, blocked);
    const taskId = `${routeId}-t${i}`;
    const tasks: ExecutionTask[] = [
      {
        id: taskId,
        labelRu: `${STAGE_NAMES_PREMIUM[i]} · контур`,
        owner,
        state: st,
        effortScore: clamp(38 + (hashStr(`${routeId}-${i}`) % 40)),
        pressure: clamp(32 + i * 3 + (hashStr(`${seed}-${i}`) % 14)),
        confidence: clamp(62 + (hashStr(`${routeId}-c-${i}`) % 28)),
        dependsOnTaskIds: i > 0 ? [`${routeId}-t${i - 1}`] : [],
      },
    ];
    const depRu =
      i === 0
        ? "Нет входящих — старт от Trend Radar / Signal Fabric"
        : i === 8
          ? "Зависит: hero visuals · SKU опубликован · brand fit"
          : i === 9
            ? "Зависит: стабильный CTR · capacity DTF · глубина стока FBO"
            : i === 5
              ? "Зависит: семантический кластер · naming SKU · карточка"
              : i === 7
                ? "Зависит: DNA fit · визуальная когерентность · нарратив"
                : `Синхронизация со стадией ${i} · импульс Initiative Engine`;

    stages.push({
      index: i,
      nameRu: STAGE_NAMES_PREMIUM[i]!,
      status: st,
      owner,
      dependencyRu: depRu,
      estimatedEffort: tasks[0]!.effortScore,
      pressure: tasks[0]!.pressure,
      confidence: tasks[0]!.confidence,
      tasks,
    });
  }
  return { routeId, titleRu: "Основная launch-последовательность", stages };
}

function defaultSystems(kind: ExecutionRouteKind): OrchestratorSystem[] {
  const base: OrchestratorSystem[] = [
    "signal_fabric",
    "temporal_strategy",
    "initiative_engine",
    "mission_control",
  ];
  if (kind === "seo_reinforcement") return [...base, "seo", "memory", "command"];
  if (kind === "visual_refresh") return [...base, "visual", "campaign", "brand_dna"];
  if (kind === "fbo_scale") return [...base, "production", "strategic_simulation"];
  if (kind === "fast_dtf_test") return [...base, "production", "visual"];
  if (kind === "production_stabilization") return [...base, "production", "command"];
  if (kind === "brand_correction") return [...base, "brand_dna", "visual", "campaign"];
  return [...base, "trend_radar", "seo", "visual", "production", "campaign"];
}

function buildRoutes(
  synthesis: CognitiveSynthesisState,
  decision: DecisionEngineState,
  initiatives: readonly StrategicInitiative[],
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  temporal: TemporalStrategySnapshot,
  fabric: SignalFabricSnapshot | null,
  predictive: PredictiveEngineSnapshot,
  pulseGeneration: number,
): ExecutionRoute[] {
  const seed = hashStr(`orch-${pulseGeneration}-${synthesis.regime}`);
  const blocked = temporal.decay.productionOverload > 68 || decision.riskProductionOverload > 70;
  const top = initiatives[0] ?? null;
  const volNudge = Math.min(8, Math.round(predictive.volatilityIndex * 0.06));

  const mk = (
    id: string,
    kind: ExecutionRouteKind,
    titleRu: string,
    objectiveRu: string,
    reasonRu: string,
    urgency: ExecutionRoute["urgency"],
    impactRu: string,
    conf: number,
    routeState: RouteState,
    risksRu: string,
    blockersRu: string[],
    nextRu: string,
  ): ExecutionRoute => ({
    id,
    kind,
    titleRu,
    objectiveRu,
    reasonRu,
    urgency,
    expectedImpactRu: impactRu,
    confidence: clamp(conf),
    routeState,
    systems: defaultSystems(kind),
    risksRu,
    blockersRu,
    nextActionRu: nextRu,
    sequence: buildSequence(id, seed + hashStr(id) % 100, blocked && kind === "premium_capsule"),
  });

  const routes: ExecutionRoute[] = [
    mk(
      "rt-premium",
      "premium_capsule",
      ROUTE_KIND_LABEL_RU.premium_capsule,
      top
        ? `Исполнение: ${top.headlineRu.slice(0, 100)}${top.headlineRu.length > 100 ? "…" : ""}`
        : `Премиальный дроп в коридоре «${synthesis.dominantClusterRu}» под контролем маржи.`,
      fabric
        ? `Каскад сигнальной сети и temporal окно: ${temporal.bestLaunchWindowRu.slice(0, 120)}…`
        : `${decision.executiveReasoningRu.slice(0, 160)}…`,
      top?.priority === "critical" ? "critical" : synthesis.regime === "production_load" ? "high" : "standard",
      "Маржа героя, доля капсулы, устойчивость FBO при контролируемом охвате.",
      74 + (seed % 12) - volNudge,
      blocked ? "blocked" : "active",
      decision.launch.risksRu.slice(0, 200),
      blocked ? ["Очередь DTF", "FBO readiness ниже целевого коридора"] : ["Контроль gate Brand DNA на стадии 2"],
      blocked
        ? "Следующий шаг: снизить параллельные SKU на 15%, перенести FBO-волну на +7 дней."
        : "Следующий шаг: зафиксировать hero SKU и запустить стадию SEO-кластера.",
    ),
    mk(
      "rt-dtf",
      "fast_dtf_test",
      ROUTE_KIND_LABEL_RU.fast_dtf_test,
      "Тихий DTF-тест гипотезы принта без расширения матрицы.",
      "Strategic Simulation: сценарий B предполагает низкий fast-scale риск при узкой капсуле.",
      "standard",
      "Быстрая валидация CTR и proof без FBO-накопления.",
      66,
      "waiting",
      "Риск: шум на WB при слабом SEO-слое.",
      ["Зависимость: свободный слот печати"],
      "Забронировать слот DTF и подготовить 1 hero card.",
    ),
    mk(
      "rt-seo",
      "seo_reinforcement",
      ROUTE_KIND_LABEL_RU.seo_reinforcement,
      "Усиление long-tail и entity-опоры под героя.",
      `Temporal: SEO saturation ${temporal.decay.seoSaturation}% · leverage ${decision.rank.seoLeverage}.`,
      decision.rank.seoLeverage < 50 ? "high" : "standard",
      "Устойчивость выдачи WB/Ozon без размытия премиальной подписи.",
      69,
      "synchronized",
      "Параллельные кластеры без якоря SKU.",
      ["Семантический overlap"],
      "Зафиксировать кластер и синхронизировать naming с Rich.",
    ),
    mk(
      "rt-vis",
      "visual_refresh",
      ROUTE_KIND_LABEL_RU.visual_refresh,
      "Motion + still refresh для снятия CTR fatigue.",
      `Decay CTR ${temporal.decay.ctrFatigue}% · визуал ${temporal.decay.visualFatigue}%.`,
      temporal.decay.ctrFatigue > 58 ? "high" : "observe",
      "Восстановление отклика витрины и премиального восприятия.",
      71,
      modP(modules, "visual") > 56 ? "active" : "waiting",
      "Риск выхода за DNA при ускорении креатива.",
      ["Brand DNA gate при расширении сцены"],
      "Утвердить proof-набор и motion-ритм под DNA.",
    ),
    mk(
      "rt-fbo",
      "fbo_scale",
      ROUTE_KIND_LABEL_RU.fbo_scale,
      "Масштаб FBO после стабилизации CTR и стока.",
      temporal.recommendedTiming === "scale_fbo" ? "Temporal рекомендует масштаб FBO." : "Контур готов к FBO-волне при подтверждении стока.",
      "standard",
      "Снижение логистического дробления и рост predictability.",
      63,
      "paused",
      "FBO при нестабильном производстве усиливает риск срыва.",
      ["CTR hero не в целевом коридоре", "Глубина стока"],
      "Проверить FBO readiness и очередь упаковки.",
    ),
    mk(
      "rt-prod",
      "production_stabilization",
      ROUTE_KIND_LABEL_RU.production_stabilization,
      "Снятие перегрева DTF и выравнивание очереди.",
      `${decision.resourceProductionRu.slice(0, 140)}…`,
      synthesis.regime === "production_load" ? "critical" : "standard",
      "Предсказуемость fulfillment и снижение operational drag.",
      68,
      "active",
      "Параллельные запуски без сдвига окна.",
      ["Packaging bottleneck", "DTF queue"],
      "Перераспределить волны по Signal Fabric + Mission Control.",
    ),
    mk(
      "rt-brand",
      "brand_correction",
      ROUTE_KIND_LABEL_RU.brand_correction,
      "Коррекция визуала и кампаний под DNA при дрейфе.",
      modules.dna?.brandGate === "hold"
        ? "Brand DNA: hold — ограничение креативного расширения."
        : "Сигнал визуальной когерентности от контра.",
      modules.dna?.brandGate === "hold" ? "critical" : "observe",
      "Снижение dilution risk и восстановление премиальной дистанции.",
      77,
      modules.dna?.brandGate === "hold" ? "blocked" : "waiting",
      "Конфликт с темпом кампаний.",
      ["DNA vs campaign pressure"],
      "Согласовать маршрут коррекции с Command и Visual.",
    ),
  ];

  return routes;
}

function buildDependencyGraph(): DependencyGraph {
  const edges: DependencyEdge[] = [
    {
      id: "dep-reels",
      fromRu: "Усиление Reels",
      toRu: "Hero visuals · SKU на витрине · brand fit",
      conditionRu: "Все три условия — иначе стадия в ожидании.",
    },
    {
      id: "dep-fbo",
      fromRu: "Масштаб FBO",
      toRu: "CTR стабилен · capacity производства · глубина стока",
      conditionRu: "FBO только при подтверждении трёх опор.",
    },
    {
      id: "dep-seo",
      fromRu: "Расширение SEO",
      toRu: "Кластер · naming SKU · карточка",
      conditionRu: "Семантика и контент синхронизированы с памятью проекта.",
    },
    {
      id: "dep-camp",
      fromRu: "Кампания",
      toRu: "DNA fit · визуал · нарратив",
      conditionRu: "Кампания не расширяется без тройной проверки.",
    },
  ];
  return {
    summaryRu: "Визуал · SKU · SEO · FBO в одном графе; импульс Signal Fabric, темп Temporal.",
    edges,
  };
}

function buildResourcePressure(
  decision: DecisionEngineState,
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  temporal: TemporalStrategySnapshot,
  fabric: SignalFabricSnapshot | null,
): ResourcePressure {
  const ops = Math.max(modP(modules, "operations"), modP(modules, "operationsBrief"));
  const dtf = clamp(Math.round(decision.riskProductionOverload * 0.85 + ops * 0.2));
  const pack = clamp(Math.round(32 + decision.riskSaturationProb * 0.35 + (hashStr("pack") % 18)));
  const content = clamp(Math.round((modP(modules, "rich") + modP(modules, "reels")) / 2 + temporal.decay.emotionalNoveltyDecay * 0.15));
  const sku = clamp(Math.round(decision.rank.strategic * 0.35 + decision.rank.saturationRisk * 0.3));
  const seo = clamp(Math.round(100 - decision.rank.seoLeverage + modP(modules, "seo") * 0.25));
  const camp = clamp(Math.round(modP(modules, "campaign") + decision.riskCtrFatigue * 0.2));
  const fbo = clamp(Math.round(72 - temporal.decay.productionOverload * 0.4 + (fabric?.pressures.production ?? 40) * 0.15));
  return {
    dtfQueue: dtf,
    packagingBottleneck: pack,
    contentLoad: content,
    skuComplexity: sku,
    seoBandwidth: seo,
    campaignPressure: camp,
    fboReadiness: fbo,
    summaryRu: `Узкое место: DTF ${dtf}% · упаковка ${pack}% · контент ${content}% · кампании ${camp}%.`,
  };
}

function buildBlockers(routes: ExecutionRoute[], fabric: SignalFabricSnapshot | null): Blocker[] {
  const out: Blocker[] = [];
  if (fabric) {
    const hot = fabric.conflicts.filter((c) => c.id !== "cf-nominal")[0];
    if (hot) {
      out.push({
        id: "bk-fabric",
        labelRu: hot.labelRu,
        severity: hot.severity,
        affectsRouteIds: routes.filter((r) => r.routeState === "blocked" || r.urgency === "critical").map((r) => r.id),
      });
    }
  }
  out.push({
    id: "bk-ctr",
    labelRu: "Ослабление CTR на герое — задержка стадий amplification",
    severity: 52,
    affectsRouteIds: ["rt-premium", "rt-vis"],
  });
  return out;
}

export type BuildOrchestrationInput = {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  initiatives: readonly StrategicInitiative[];
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  pulseGeneration: number;
  temporal: TemporalStrategySnapshot;
  fabric: SignalFabricSnapshot | null;
  predictive: PredictiveEngineSnapshot;
};

export function buildExecutionOrchestration(input: BuildOrchestrationInput): ExecutionOrchestrationSnapshot {
  const { synthesis, decision, initiatives, modules, pulseGeneration, temporal, fabric, predictive } = input;
  const routes = buildRoutes(synthesis, decision, initiatives, modules, temporal, fabric, predictive, pulseGeneration);
  const primaryRouteId = routes[0]!.id;
  const resourcePressure = buildResourcePressure(decision, modules, temporal, fabric);
  const blockers = buildBlockers(routes, fabric);
  const drag = clamp(
    Math.round(
      resourcePressure.dtfQueue * 0.28 +
        resourcePressure.packagingBottleneck * 0.18 +
        resourcePressure.campaignPressure * 0.22 +
        temporal.decay.productionOverload * 0.22,
    ),
  );
  const executionConfidence = clamp(
    Math.round(
      synthesis.launchReadiness * 0.45 + (100 - drag) * 0.35 + (fabric ? fabric.stream[0]?.confidence ?? 70 : 68) * 0.15 + readSelfEvolvingSyncAdjustments().executionConfidenceBias,
    ),
  );

  const nextBestActionRu = routes[0]!.nextActionRu;

  const systemsInvolvedRu = Array.from(new Set(routes.flatMap((r) => r.systems))).map((s) => SYSTEM_LABEL_RU[s]);

  const integrationRu = [
    `Signal Fabric: ${fabric ? `ядро ${fabric.corePressure}%` : "вне полного следа"}.`,
    `Temporal · окно запуска учтено в «${routes[0]!.titleRu}».`,
    `Симуляция: ${predictive.horizon}, волатильность ${predictive.volatilityIndex}%.`,
    `Initiative Engine: ${initiatives.length} инициатив.`,
    `Mission Control / Command: такт и gate.`,
    `Brand DNA: стадии 2, 7, 9.`,
    `Project Memory: паттерны в SEO / FBO readiness.`,
  ];

  const actionCommandLayer = buildActionCommands({
    routes,
    initiatives,
    modules,
    temporal,
    fabric,
    synthesis,
    decision,
    pulseGeneration,
  });

  return {
    generatedAt: Date.now(),
    pulseGeneration,
    routes,
    primaryRouteId,
    dependencyGraph: buildDependencyGraph(),
    resourcePressure,
    blockers,
    nextBestActionRu,
    executionConfidence,
    operationalDrag: drag,
    systemsInvolvedRu,
    integrationRu,
    actionCommandLayer,
  };
}
