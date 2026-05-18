import type { NavId } from "../../types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type { CognitiveSynthesisState, DecisionEngineState, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import type { TemporalStrategySnapshot } from "../temporal-strategy/types";
import { TEMPORAL_PHASE_RU } from "../temporal-strategy/types";
import type { SignalFabricSnapshot } from "../signal-fabric/types";
import type {
  Bottleneck,
  ExecutionPlanSnapshot,
  ExecutionState,
  LaunchQueueItem,
  MissionStage,
  PlannerMission,
  PlannerTask,
  ResourceAllocation,
  RoutingEdge,
  SystemLoad,
  SystemOwner,
  MissionUrgency,
} from "./types";
import type { ExecutionMemoryHints } from "./memoryHints";
import { clamp, hashStr } from "../math";

const STAGE_NAMES_RU = [
  "Валидация тренда",
  "Выравнивание нарратива",
  "Архитектура SKU",
  "Генерация принт-концепта",
  "Производство контента",
  "Синхронизация SEO",
  "Аллокация производства",
  "Развёртывание на маркетплейсе",
  "Усиление Reels",
  "Расширение FBO",
] as const;

const STAGE_OWNERS: SystemOwner[][] = [
  ["trend_radar"],
  ["brand_dna", "strategic_command"],
  ["strategic_command"],
  ["visual_lab"],
  ["visual_lab", "campaigns"],
  ["seo_core"],
  ["production_core"],
  ["marketplace_routing"],
  ["campaigns"],
  ["production_core"],
];

function stateForStage(idx: number, seed: number, delayed: boolean): ExecutionState {
  if (delayed && idx >= 6) return idx === 7 ? "blocked" : "delayed";
  if (idx < 2) return "synchronized";
  if (idx === 2 || idx === 3) return "active";
  if (idx === 4) return seed % 2 === 0 ? "risk" : "active";
  if (idx < 6) return "waiting";
  if (idx === 6) return "synchronized";
  return (seed + idx) % 9 === 0 ? "completed" : "queued";
}

function buildStages(missionId: string, seed: number, delayed: boolean): MissionStage[] {
  const stages: MissionStage[] = [];
  for (let i = 0; i < STAGE_NAMES_RU.length; i++) {
    const owners = STAGE_OWNERS[i] ?? ["mission_control"];
    const st = stateForStage(i, seed + i * 13, delayed);
    const tasks: PlannerTask[] = owners.map((owner, j) => ({
      id: `${missionId}-s${i}-t${j}`,
      missionId,
      stageIndex: i,
      owner,
      labelRu: `${STAGE_NAMES_RU[i]} · ${owner}`,
      state: j === 0 ? st : st === "active" ? "waiting" : "synchronized",
      priority: clamp(90 - i * 6 - j * 2),
      dependsOn: i > 0 ? [`${missionId}-s${i - 1}-t0`] : [],
      effortScore: clamp(40 + (hashStr(`${missionId}-${i}-${j}`) % 45)),
      timelineRu: i < 3 ? "1–3 дня" : i < 7 ? "3–10 дней" : "7–21 день",
      pressure: clamp(35 + i * 4 + (hashStr(`${seed}-${i}`) % 12)),
    }));
    stages.push({ index: i, nameRu: STAGE_NAMES_RU[i]!, state: st, tasks });
  }
  return stages;
}

function routingFromMissions(): RoutingEdge[] {
  const order: SystemOwner[] = [
    "trend_radar",
    "brand_dna",
    "strategic_command",
    "visual_lab",
    "seo_core",
    "production_core",
    "marketplace_routing",
    "campaigns",
  ];
  const edges: RoutingEdge[] = [];
  for (let i = 0; i < order.length - 1; i++) {
    const from = order[i]!;
    const to = order[i + 1]!;
    edges.push({
      from,
      to,
      intensity: clamp(40 + (i + 3) * 7),
      labelRu: `Поток ${i + 1}`,
    });
  }
  edges.push({
    from: "campaigns",
    to: "production_core",
    intensity: 62,
    labelRu: "FBO-связка",
  });
  return edges;
}

function systemLoadsFromModules(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>): SystemLoad[] {
  const p = (id: NavId) => modules[id]?.pressure ?? 40;
  return [
    { system: "trend_radar" as const, load: p("trends"), statusRu: p("trends") > 55 ? "ускорение сигналов" : "стабильно" },
    { system: "visual_lab" as const, load: p("visual"), statusRu: p("visual") > 58 ? "нагрузка на proof" : "в норме" },
    { system: "seo_core" as const, load: p("seo"), statusRu: "кластерное давление" },
    { system: "production_core" as const, load: Math.max(p("operations"), p("operationsBrief")), statusRu: "очередь печати" },
    { system: "campaigns" as const, load: p("campaign"), statusRu: "плотность запусков" },
    { system: "mission_control" as const, load: p("missionControl"), statusRu: "оркестрация" },
    { system: "strategic_command" as const, load: p("command"), statusRu: "окна решений" },
  ];
}

function bottlenecksFrom(
  decision: DecisionEngineState,
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  fabric?: SignalFabricSnapshot,
): Bottleneck[] {
  const out: Bottleneck[] = [];
  if (fabric) {
    const hot = fabric.conflicts.filter((c) => c.id !== "cf-nominal").sort((a, b) => b.severity - a.severity)[0];
    if (hot && hot.severity > 42) {
      out.push({
        id: "bn-fabric",
        labelRu: `Сигнальная сеть · ${hot.labelRu.slice(0, 96)}`,
        severity: hot.severity,
        relatedSystem: "mission_control",
      });
    }
  }
  if (decision.riskProductionOverload > 55) {
    out.push({
      id: "bn-prod",
      labelRu: "Перегруз производственного контура",
      severity: decision.riskProductionOverload,
      relatedSystem: "production_core",
    });
  }
  if (decision.riskCtrFatigue > 52) {
    out.push({
      id: "bn-ctr",
      labelRu: "Давление на CTR и витрину",
      severity: decision.riskCtrFatigue,
      relatedSystem: "visual_lab",
    });
  }
  const seop = modules.seo?.pressure ?? 0;
  if (seop > 56) {
    out.push({
      id: "bn-seo",
      labelRu: "SEO saturation · узкое место семантики",
      severity: Math.round(seop),
      relatedSystem: "seo_core",
    });
  }
  if (out.length === 0) {
    out.push({
      id: "bn-nominal",
      labelRu: "Критических узких мест не зафиксировано — держать ритм синхронизации",
      severity: 28,
      relatedSystem: "mission_control",
    });
  }
  return out;
}

function computeResourceAllocation(
  decision: DecisionEngineState,
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
): ResourceAllocation {
  const ops = Math.max(modules.operations?.pressure ?? 0, modules.operationsBrief?.pressure ?? 0);
  const sku = decision.rank.strategic * 0.35 + decision.rank.saturationRisk * 0.25;
  return {
    productionPressure: clamp(Math.round(decision.riskProductionOverload * 0.9 + ops * 0.15)),
    contentLoad: clamp(Math.round((modules.rich?.pressure ?? 40) * 0.85 + (modules.reels?.pressure ?? 38) * 0.2)),
    seoBandwidth: clamp(Math.round(100 - decision.rank.seoLeverage + (modules.seo?.pressure ?? 0) * 0.3)),
    skuComplexity: clamp(Math.round(sku)),
    launchDensity: clamp(Math.round((modules.campaign?.pressure ?? 42) + decision.riskSaturationProb * 0.2)),
    overloadRisk: clamp(Math.round(decision.riskProductionOverload * 0.45 + decision.riskCtrFatigue * 0.25 + ops * 0.2)),
    redistributionRu:
      ops > 58
        ? "Предложение: сместить контент-волну на +5–8 дней, сократить параллельные SKU на 20%, приоритизировать FBO подтверждённых героев."
        : "Предложение: удержать текущий микс; SEO и Visual получают равный вес до следующего окна запуска.",
  };
}

function adaptations(
  temporal: TemporalStrategySnapshot,
  decision: DecisionEngineState,
  initiatives: readonly StrategicInitiative[],
  fabric?: SignalFabricSnapshot,
): string[] {
  const a: string[] = [];
  if (fabric && fabric.pressures.execution > 70) {
    a.push("Сигнальная сеть: высокое давление исполнения — ужесточить зависимости стадий 4–7.");
  }
  if (temporal.decay.productionOverload > 62) {
    a.push("Адаптация: задержать массовый запуск на 10–14 дней; разделить капсулу на две волны DTF.");
  }
  if (decision.riskCtrFatigue > 60) {
    a.push("Адаптация: приоритизировать refresh визуала и motion до следующей волны контента.");
  }
  if (initiatives.some((i) => i.priority === "critical")) {
    a.push("Адаптация: пересобрать последовательность стадий 6–8 под критический импульс Initiative Engine.");
  }
  if (temporal.recommendedTiming === "stop_expansion") {
    a.push("Адаптация: снизить SKU entropy — убрать спутниковые SKU до стабилизации CTR.");
  }
  if (a.length === 0) {
    a.push("Контур: план стабилен; точечные корректировки только по сигналу Mission Control.");
  }
  return a;
}

function missionUrgencyFrom(init: StrategicInitiative | null, regime: string): MissionUrgency {
  if (!init) return regime === "production_load" ? "high" : "standard";
  if (init.priority === "critical") return "critical";
  if (init.priority === "high_leverage") return "high";
  if (init.priority === "observe") return "observe";
  return "standard";
}

function bumpUrgencyFromFabric(u: MissionUrgency, fabric?: SignalFabricSnapshot): MissionUrgency {
  if (!fabric) return u;
  if (u === "critical") return u;
  if (fabric.pressures.execution > 78 && (u === "standard" || u === "observe")) return "high";
  if (fabric.pressures.production > 82 && u === "observe") return "standard";
  if (fabric.pressures.production > 82 && u === "standard") return "high";
  return u;
}

export type BuildExecutionPlanInput = {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  initiatives: readonly StrategicInitiative[];
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  pulseGeneration: number;
  temporal: TemporalStrategySnapshot;
  memoryHints: ExecutionMemoryHints;
  fabric?: SignalFabricSnapshot;
};

export function buildExecutionPlan(input: BuildExecutionPlanInput): ExecutionPlanSnapshot {
  const { synthesis, decision, initiatives, modules, pulseGeneration, temporal, memoryHints, fabric } = input;
  const seed = hashStr(`exec-${pulseGeneration}-${synthesis.regime}-${synthesis.dominantClusterRu}`);
  const delayed =
    temporal.decay.productionOverload > 64 ||
    decision.riskProductionOverload > 68 ||
    (fabric ? fabric.pressures.production > 74 : false);

  const top = initiatives[0] ?? null;
  const primaryUrgency = bumpUrgencyFromFabric(missionUrgencyFrom(top, synthesis.regime), fabric);
  const m1: PlannerMission = {
    id: "m-primary",
    objectiveRu: top
      ? `Исполнение: ${top.headlineRu.slice(0, 120)}${top.headlineRu.length > 120 ? "…" : ""}`
      : `Запуск премиальной oversize-капсулы в коридоре «${synthesis.dominantClusterRu}»`,
    reasonRu: top
      ? `Связано с инициативой контура: ${top.bodyRu.slice(0, 160)}${top.bodyRu.length > 160 ? "…" : ""}`
      : `${decision.executiveReasoningRu.slice(0, 220)}${decision.executiveReasoningRu.length > 220 ? "…" : ""}`,
    urgency: primaryUrgency,
    expectedImpactRu: "Маржа и доля героя при контролируемом охвате; усиление long-tail опоры.",
    difficulty: clamp(Math.round(100 - decision.rank.executionDifficulty * 0.4 + (delayed ? 12 : 0))),
    timelineRu: delayed ? "18–32 дня (с буфером)" : "12–24 дня",
    systems: ["trend_radar", "brand_dna", "visual_lab", "seo_core", "production_core", "marketplace_routing", "campaigns"],
    dependenciesRu: "Зависимости: Brand DNA gate → принт-концепт → производство → SEO sync → маркетплейс → FBO.",
    risksRu: `${decision.launch.risksRu.slice(0, 180)}${decision.launch.risksRu.length > 180 ? "…" : ""}`,
    successRu: "Успех: стабильный CTR героя, подтверждённая полоса DTF, FBO без вторичных срывов.",
    stages: buildStages("m-primary", seed, delayed),
    adaptationsRu: adaptations(temporal, decision, initiatives, fabric),
  };

  const m2: PlannerMission = {
    id: "m-seo",
    objectiveRu: "Расширение и углубление SEO-кластера под героя",
    reasonRu: `Семантическое давление и temporal horizon: ${temporal.horizons.find((h) => h.horizon === "longTail")?.riskHintRu ?? "контроль дифференциации"}.`,
    urgency: bumpUrgencyFromFabric(decision.rank.seoLeverage < 50 ? "high" : "standard", fabric),
    expectedImpactRu: "Рост устойчивости выдачи без размытия премиальной подписи.",
    difficulty: clamp(58 + Math.round((100 - decision.rank.seoLeverage) * 0.2)),
    timelineRu: "10–28 дней",
    systems: ["seo_core", "visual_lab", "strategic_command"],
    dependenciesRu: "После валидации нарратива и принт-концепта; синхрон с контент-волной.",
    risksRu: "Параллельное расширение кластеров без entity-героя.",
    successRu: "Успех: закреплённая entity-опора и согласованный rich-слой.",
    stages: buildStages("m-seo", seed + 17, false).slice(0, 7),
    adaptationsRu: [decision.rank.seoLeverage < 48 ? "Адаптация: удвоить SEO-поддержку стадий 5–6." : "Контур: SEO в базовом каденсе."],
  };

  const m3: PlannerMission = {
    id: "m-ops",
    objectiveRu: "Стабилизация производственной нагрузки и FBO-ритма",
    reasonRu: `${decision.resourceProductionRu} · ${temporal.fatigueForecastRu.slice(0, 120)}…`,
    urgency: synthesis.regime === "production_load" ? "critical" : "observe",
    expectedImpactRu: "Снижение operational overload risk и предсказуемость fulfillment.",
    difficulty: clamp(48 + decision.riskProductionOverload / 2),
    timelineRu: "7–18 дней",
    systems: ["production_core", "mission_control", "marketplace_routing"],
    dependenciesRu: "Связь с аллокацией производства и маркетплейс-деплоем основной миссии.",
    risksRu: "Параллельные запуски без сдвига очереди.",
    successRu: "Успех: очередь DTF в целевом коридоре, FBO только подтверждённые SKU.",
    stages: buildStages("m-ops", seed + 31, delayed).slice(0, 5),
    adaptationsRu:
      delayed
        ? ["Адаптация: приоритизировать margin over reach; отложить content wave."]
        : ["Контур: производство в допустимой полосе."],
  };

  const missions: PlannerMission[] = [m1, m2, m3];

  const launchQueue: LaunchQueueItem[] = [
    {
      id: "lq-1",
      labelRu: m1.objectiveRu.slice(0, 80) + (m1.objectiveRu.length > 80 ? "…" : ""),
      windowRu: temporal.bestLaunchWindowRu.slice(0, 120) + (temporal.bestLaunchWindowRu.length > 120 ? "…" : ""),
      urgency: m1.urgency,
    },
    {
      id: "lq-2",
      labelRu: "Вторая волна: SEO + rich подтверждение героя",
      windowRu: "14–21 день после первой волны деплоя",
      urgency: "standard",
    },
  ];

  const bottlenecks = bottlenecksFrom(decision, modules, fabric);
  const systemLoads = systemLoadsFromModules(modules);
  const routing = routingFromMissions();
  const resourceAllocation = computeResourceAllocation(decision, modules);

  const sequencingNoteRu =
    "Стратегическое sequencing: Mission Control держит такт, Strategic Command фиксирует окна, Temporal Strategy задаёт темп фаз, Initiative Engine — триггеры перестроения. Все миссии остаются в одном операционном организме.";

  const upcomingLaunchesRu = [
    `Ближайший фокус: ${synthesis.topOpportunityRu.slice(0, 100)}${synthesis.topOpportunityRu.length > 100 ? "…" : ""}`,
    temporal.narrative.nextDropTimingRu,
  ];

  const integrationRu = [
    `Initiative Engine: ${initiatives.length} активных инициатив в контуре.`,
    `Decision Engine: ${decision.opportunityLabelRu} · готовность запуска ${synthesis.launchReadiness}%.`,
    `Temporal Strategy: фаза «${TEMPORAL_PHASE_RU[temporal.phase]}» · терпение ${temporal.patienceScore}/100.`,
    `Mission Control: давление сети ${synthesis.pressureIndex}%.`,
    `Trend Radar: ${temporal.integration.trendRadarRu}`,
    `Strategic Command: ${temporal.integration.strategicCommandRu}`,
    `Project Memory: ${temporal.integration.memorySummaryRu}`,
    memoryHints.savedPlansCount > 0
      ? `Память execution_planner: ${memoryHints.savedPlansCount} сохранённых планов${memoryHints.lastPlanTitle ? ` · последний: «${memoryHints.lastPlanTitle}»` : ""}.`
      : "Память execution_planner: сохраните план для обучения последовательностей.",
    fabric
      ? `Сигнальная сеть: ядро ${fabric.corePressure}% · каскадов ${fabric.cascades.length} · конфликтов ${fabric.conflicts.length}.`
      : "Сигнальная сеть: ожидание контура.",
  ];

  return {
    generatedAt: Date.now(),
    pulseGeneration,
    missions,
    launchQueue,
    bottlenecks,
    systemLoads,
    routing,
    resourceAllocation,
    sequencingNoteRu,
    upcomingLaunchesRu,
    integrationRu,
  };
}
