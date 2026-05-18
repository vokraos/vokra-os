import type { NavId } from "../../types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type {
  CognitivePulseEvent,
  CognitiveSynthesisState,
  DecisionEngineState,
  ModuleCognitiveSnapshot,
} from "../cognitive-os/types";
import type { TemporalStrategySnapshot } from "../temporal-strategy/types";
import type {
  CausalChain,
  FabricModuleKey,
  ModuleInfluence,
  SignalCascade,
  SignalConflict,
  SignalEdge,
  SignalEvent,
  SignalFabricSnapshot,
  SignalNode,
  SignalPressureMap,
  SignalPropagation,
  SignalStreamEntry,
} from "./types";
import type { FabricMemoryHints } from "./memoryHints";
import { clamp, hashStr } from "../math";

function navToFabric(id: NavId): FabricModuleKey | null {
  const m: Partial<Record<NavId, FabricModuleKey>> = {
    missionControl: "missionControl",
    trends: "trends",
    command: "command",
    strategicSimulation: "strategicSimulation",
    temporalStrategy: "temporalStrategy",
    executionPlanner: "executionPlanner",
    executionOrchestrator: "executionOrchestrator",
    dna: "dna",
    seo: "seo",
    visual: "visual",
    rich: "rich",
    reels: "reels",
    campaign: "campaign",
    analytics: "analytics",
    memory: "memory",
    operations: "operations",
    operationsBrief: "operations",
  };
  return m[id] ?? null;
}

const NODE_ORDER: FabricModuleKey[] = [
  "missionControl",
  "initiativeEngine",
  "trends",
  "command",
  "strategicSimulation",
  "temporalStrategy",
  "executionPlanner",
  "executionOrchestrator",
  "dna",
  "seo",
  "visual",
  "rich",
  "reels",
  "campaign",
  "analytics",
  "memory",
  "operations",
];

const NAV_BY_FABRIC: Record<Exclude<FabricModuleKey, "initiativeEngine">, NavId> = {
  missionControl: "missionControl",
  trends: "trends",
  command: "command",
  strategicSimulation: "strategicSimulation",
  temporalStrategy: "temporalStrategy",
  executionPlanner: "executionPlanner",
  executionOrchestrator: "executionOrchestrator",
  dna: "dna",
  seo: "seo",
  visual: "visual",
  rich: "rich",
  reels: "reels",
  campaign: "campaign",
  analytics: "analytics",
  memory: "memory",
  operations: "operations",
};

const NODE_LABELS: Record<FabricModuleKey, string> = {
  missionControl: "Mission Control",
  initiativeEngine: "Initiative Engine",
  trends: "Trend Radar",
  command: "Strategic Command",
  strategicSimulation: "Strategic Simulation",
  temporalStrategy: "Temporal Strategy",
  executionPlanner: "Планировщик исполнения",
  executionOrchestrator: "Оркестратор исполнения",
  dna: "Brand DNA",
  seo: "SEO Core",
  visual: "Visual Intelligence",
  rich: "Rich Content",
  reels: "Reels",
  campaign: "Кампании",
  analytics: "Аналитика",
  memory: "Память проектов",
  operations: "Производство / операции",
};

function modPressure(modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>, id: NavId): number {
  return modules[id]?.pressure ?? 40;
}

function buildNodes(
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  initiatives: readonly StrategicInitiative[],
  pulseGeneration: number,
): SignalNode[] {
  const seed = hashStr(`nodes-${pulseGeneration}`);
  const out: SignalNode[] = [];
  for (const key of NODE_ORDER) {
    if (key === "initiativeEngine") {
      const n = initiatives.length;
      const activation = clamp(38 + n * 6 + (seed % 9));
      out.push({
        id: key,
        labelRu: NODE_LABELS[key],
        activation,
        pressure: clamp(32 + n * 5),
        confidence: clamp(70 + (seed % 18)),
        syncRu: n > 2 ? "импульсы перекрёстные" : "контур согласован",
      });
      continue;
    }
    const snapKey = NAV_BY_FABRIC[key];
    const m = modules[snapKey];
    const pressure = m?.pressure ?? 40;
    const confidence = m?.confidence ?? 68;
    const activation = clamp(Math.round(pressure * 0.55 + confidence * 0.35 + (hashStr(`${key}-${seed}`) % 12)));
    const syncRu =
      m?.sync === "catchup" ? "догоняющая синхронизация" : m?.sync === "drift" ? "лёгкий дрейф" : "синхронизировано";
    out.push({
      id: key,
      labelRu: NODE_LABELS[key],
      activation,
      pressure,
      confidence: Math.round(confidence),
      syncRu,
    });
  }
  return out;
}

function buildEdges(lastEvent: CognitivePulseEvent | null, pulseGeneration: number): SignalEdge[] {
  const edges: SignalEdge[] = [];
  const add = (from: FabricModuleKey, to: FabricModuleKey, intensity: number, labelRu: string, i: number) => {
    edges.push({
      id: `e-${from}-${to}-${i}`,
      from,
      to,
      intensity: clamp(intensity),
      flowDurationSec: 96 + (hashStr(`${from}-${to}-${pulseGeneration}`) % 40),
      labelRu,
    });
  };

  let i = 0;
  const backbone: [FabricModuleKey, FabricModuleKey, string][] = [
    ["trends", "temporalStrategy", "Тренд → время"],
    ["temporalStrategy", "initiativeEngine", "Время → инициатива"],
    ["initiativeEngine", "executionPlanner", "Инициатива → исполнение"],
    ["executionPlanner", "executionOrchestrator", "План → оркестрация маршрутов"],
    ["strategicSimulation", "executionOrchestrator", "Симуляция → маршруты запуска"],
    ["missionControl", "executionOrchestrator", "Ядро → координация исполнения"],
    ["command", "executionOrchestrator", "Команда → операционные маршруты"],
    ["command", "strategicSimulation", "Команда → симуляция"],
    ["strategicSimulation", "missionControl", "Симуляция → ядро"],
    ["dna", "visual", "DNA → визуал"],
    ["visual", "campaign", "Визуал → кампании"],
    ["seo", "rich", "SEO → rich"],
    ["operations", "executionPlanner", "Производство → план"],
    ["memory", "temporalStrategy", "Память → темп"],
    ["analytics", "command", "Аналитика → решение"],
  ];
  for (const [a, b, label] of backbone) {
    add(a, b, 36 + (i % 5) * 6, label, i);
    i += 1;
  }

  if (lastEvent) {
    const src = navToFabric(lastEvent.source);
    if (src) {
      for (const t of lastEvent.targets) {
        const tg = navToFabric(t);
        if (!tg || tg === src) continue;
        add(src, tg, 52 + (pulseGeneration % 20), `Импульс: ${lastEvent.titleRu.slice(0, 48)}`, i);
        i += 1;
      }
    }
  }
  return edges;
}

type SignalUrgency = SignalEvent["urgency"];

function urgencyFrom(init: StrategicInitiative | null, intensity: number): SignalUrgency {
  if (init?.priority === "critical" || intensity > 82) return "critical";
  if (init?.priority === "high_leverage" || intensity > 68) return "high";
  if (init?.priority === "observe") return "observe";
  return "standard";
}

function buildEvents(
  synthesis: CognitiveSynthesisState,
  decision: DecisionEngineState,
  temporal: TemporalStrategySnapshot,
  initiatives: readonly StrategicInitiative[],
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  mem: FabricMemoryHints,
  pulseGeneration: number,
): SignalEvent[] {
  const now = Date.now();
  const top = initiatives[0] ?? null;
  const u0 = urgencyFrom(top, synthesis.pressureIndex);

  const events: SignalEvent[] = [
    {
      id: "ev-trend-1",
      type: "TREND_SIGNAL",
      source: "trends",
      targets: ["temporalStrategy", "command", "missionControl"],
      intensity: clamp(modPressure(modules, "trends") + 8),
      confidence: 74,
      urgency: u0,
      causeRu: "Радар фиксирует ускорение ниши и смену плотности кластера.",
      effectRu: "Temporal Strategy пересобирает окно запуска; контур повышает внимание Mission Control.",
      timestamp: now - 4200,
      lifespanMs: 240_000,
      labelRu: "Тренд · ускорение коридора",
      explanationRu: "Импульс распространяется на временную модель и командный центр без расширения SKU.",
    },
    {
      id: "ev-seo-1",
      type: "SEO_SIGNAL",
      source: "seo",
      targets: ["rich", "campaign", "memory"],
      intensity: clamp(decision.riskSaturationProb + modPressure(modules, "seo") * 0.35),
      confidence: clamp(62 + (pulseGeneration % 15)),
      urgency: decision.rank.seoLeverage < 48 ? "high" : "standard",
      causeRu: "Семантическое пересечение кластеров и дрейф long-tail.",
      effectRu: "Rich и кампании получают корректирующий вектор; память подтягивает прошлые структуры.",
      timestamp: now - 9100,
      lifespanMs: 300_000,
      labelRu: "SEO · перекрытие кластеров",
      explanationRu: "Сигнал усиливает согласование контент-волны с entity-героем.",
    },
    {
      id: "ev-vis-1",
      type: "VISUAL_SIGNAL",
      source: "visual",
      targets: ["reels", "campaign", "dna"],
      intensity: clamp(temporal.decay.ctrFatigue * 0.45 + modPressure(modules, "visual") * 0.5),
      confidence: 68,
      urgency: temporal.decay.ctrFatigue > 60 ? "high" : "standard",
      causeRu: "Hero fatigue и снижение свежести витрины.",
      effectRu: "Reels и кампании смещаются к proof-motion; Brand DNA проверяет допуск.",
      timestamp: now - 13300,
      lifespanMs: 280_000,
      labelRu: "Визуал · ослабление CTR",
      explanationRu: "Контур переводит акцент на кинематографию и удержание премиальной подписи.",
    },
    {
      id: "ev-brand-1",
      type: "BRAND_SIGNAL",
      source: "dna",
      targets: ["visual", "campaign", "rich"],
      intensity: clamp(
        (modules.dna?.brandGate === "hold" ? 72 : modules.dna?.brandGate === "watch" ? 58 : 40) + decision.riskBrandDilution * 0.25,
      ),
      confidence: 80,
      urgency: modules.dna?.brandGate === "hold" ? "critical" : "standard",
      causeRu: "Конституция бренда: риск дрейфа от премиального минимализма.",
      effectRu: "Визуал и кампании входят в режим коррекции; confidence downstream снижается.",
      timestamp: now - 6200,
      lifespanMs: 360_000,
      labelRu: "Brand DNA · контур gate",
      explanationRu: "Ограничивающий слой снижает агрессию креатива до снятия конфликта.",
    },
    {
      id: "ev-prod-1",
      type: "PRODUCTION_SIGNAL",
      source: "operations",
      targets: ["executionPlanner", "executionOrchestrator", "missionControl", "strategicSimulation"],
      intensity: clamp(
        decision.riskProductionOverload * 0.85 +
          Math.max(modPressure(modules, "operations"), modPressure(modules, "operationsBrief")) * 0.2,
      ),
      confidence: 71,
      urgency: synthesis.regime === "production_load" ? "critical" : "standard",
      causeRu: "Очередь DTF / давление FBO и сложность SKU.",
      effectRu: "Планировщик исполнения задерживает стадии; симуляция снижает fast-scale.",
      timestamp: now - 15000,
      lifespanMs: 420_000,
      labelRu: "Производство · перегрев контура",
      explanationRu: "Исполнение перераспределяет окна запуска для снятия перегрузки.",
    },
    {
      id: "ev-mkt-1",
      type: "MARKET_SIGNAL",
      source: "analytics",
      targets: ["command", "strategicSimulation", "missionControl"],
      intensity: clamp(decision.riskPricingPressure + modPressure(modules, "analytics") * 0.35),
      confidence: 66,
      urgency: "standard",
      causeRu: "Агрессия цен и сдвиг спроса в премиум-срезе.",
      effectRu: "Командный центр пересчитывает окна; симуляция обновляет ветки.",
      timestamp: now - 8000,
      lifespanMs: 260_000,
      labelRu: "Рынок · ценовое давление",
      explanationRu: "Сигнал идёт в стратегическое ядро без шума на витрине.",
    },
  ];

  if (mem.hasRepeatedLaunchPattern || mem.generationCount > 14) {
    events.push({
      id: "ev-mem-1",
      type: "MEMORY_SIGNAL",
      source: "memory",
      targets: ["temporalStrategy", "executionPlanner", "executionOrchestrator", "seo"],
      intensity: clamp(44 + Math.min(mem.generationCount, 40)),
      confidence: 63,
      urgency: "observe",
      causeRu: "Повторяющийся паттерн запуска в памяти проекта.",
      effectRu: "Temporal и планировщик учитывают institutionally known риск насыщения.",
      timestamp: now - 5000,
      lifespanMs: 600_000,
      labelRu: "Память · повтор структуры",
      explanationRu: "Институциональный слой усиливает осторожность кластера.",
    });
  }

  events.push({
    id: "ev-exec-1",
    type: "EXECUTION_SIGNAL",
    source: "executionPlanner",
    targets: ["operations", "missionControl", "campaign", "executionOrchestrator"],
    intensity: clamp(48 + synthesis.launchReadiness * 0.25),
    confidence: 72,
    urgency: top?.priority === "critical" ? "critical" : "high",
    causeRu: "Миссия маршрутизирована: стадии и зависимости синхронизируются.",
    effectRu: "Производство и кампании получают очередность; ядро держит такт.",
    timestamp: now - 2100,
    lifespanMs: 200_000,
    labelRu: "Исполнение · маршрут миссии",
    explanationRu: "Каскад исполнения закрепляет причинно-следственную цепь контура.",
  });

  return events;
}

function buildPressureMap(
  decision: DecisionEngineState,
  synthesis: CognitiveSynthesisState,
  temporal: TemporalStrategySnapshot,
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  mem: FabricMemoryHints,
): SignalPressureMap {
  return {
    market: clamp(Math.round(decision.riskSaturationProb * 0.85 + modPressure(modules, "analytics") * 0.25)),
    brand: clamp(Math.round(decision.riskBrandDilution * 0.9 + (modules.dna?.pressure ?? 38) * 0.2)),
    production: clamp(
      Math.round(
        decision.riskProductionOverload * 0.88 +
          Math.max(modPressure(modules, "operations"), modPressure(modules, "operationsBrief")) * 0.22,
      ),
    ),
    seo: clamp(Math.round(temporal.decay.seoSaturation * 0.7 + modPressure(modules, "seo") * 0.35)),
    visual: clamp(Math.round(temporal.decay.visualFatigue * 0.65 + modPressure(modules, "visual") * 0.4)),
    execution: clamp(
      Math.round(
        synthesis.launchReadiness * 0.35 +
          (100 - decision.rank.executionDifficulty) * 0.25 +
          modPressure(modules, "executionPlanner") * 0.2 +
          modPressure(modules, "executionOrchestrator") * 0.12,
      ),
    ),
    memory: clamp(Math.round(28 + mem.generationCount * 1.5 + (mem.hasRepeatedLaunchPattern ? 18 : 0))),
  };
}

function buildConflicts(
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>,
  decision: DecisionEngineState,
  pulseGeneration: number,
): SignalConflict[] {
  const out: SignalConflict[] = [];
  if (modules.dna?.brandGate === "hold" && (modules.visual?.pressure ?? 0) > 54) {
    out.push({
      id: "cf-dna-vis",
      modules: ["dna", "visual"],
      severity: clamp(58 + (pulseGeneration % 20)),
      labelRu: "Конфликт: Brand DNA hold против давления визуального расширения",
      resolutionRu: "Маршрут коррекции: уменьшить агрессию креатива, усилить proof согласно DNA.",
    });
  }
  if (decision.riskCtrFatigue > 58 && modPressure(modules, "campaign") > 56) {
    out.push({
      id: "cf-ctr-camp",
      modules: ["analytics", "campaign"],
      severity: clamp(decision.riskCtrFatigue),
      labelRu: "Конфликт: кампанийный темп vs ослабление CTR",
      resolutionRu: "Снизить плотность промо; перенести импульс в refresh визуала и SEO-слой.",
    });
  }
  if (out.length === 0) {
    out.push({
      id: "cf-nominal",
      modules: ["missionControl", "strategicSimulation"],
      severity: 22,
      labelRu: "Конфликтный периметр в норме — удерживать синхронизацию узлов",
      resolutionRu: "Контур без критического столкновения сигналов; мониторинг продолжается.",
    });
  }
  return out;
}

function buildCascades(
  synthesis: CognitiveSynthesisState,
  temporal: TemporalStrategySnapshot,
  initiatives: readonly StrategicInitiative[],
): SignalCascade[] {
  const top = initiatives[0];
  return [
    {
      id: "cs-trend-exec",
      titleRu: "Каскад: тренд → время → исполнение",
      stepsRu: [
        "01 Тренд ускоряется — Trend Radar",
        "02 Окно запуска сокращается — Temporal Strategy",
        "03 Приоритет миссии повышен — Initiative Engine",
        "04 Производственный контур нагружается — Execution Planner",
        "05 Риск FBO растёт — Operations",
      ],
      headIntensity: clamp(synthesis.pressureIndex + (top ? 8 : 0)),
    },
    {
      id: "cs-brand-calm",
      titleRu: "Каскад: DNA → визуал → кампании",
      stepsRu: [
        "01 Дрейф бренда зафиксирован — Brand DNA",
        "02 Visual Intelligence — режим коррекции",
        "03 Кампании снижают агрессию креатива",
        "04 Strategic Command — снижение риска размытия",
      ],
      headIntensity: clamp(temporal.decay.emotionalNoveltyDecay * 0.6 + 30),
    },
    {
      id: "cs-prod-delay",
      titleRu: "Каскад: производство → план → симуляция",
      stepsRu: [
        "01 Давление производства растёт",
        "02 Execution Planner задерживает стадии",
        "03 Strategic Simulation снижает fast-scale вероятность",
        "04 Initiative Engine рекомендует перераспределение ресурса",
      ],
      headIntensity: clamp(temporal.decay.productionOverload),
    },
  ];
}

function buildCausalChains(decision: DecisionEngineState, synthesis: CognitiveSynthesisState): CausalChain[] {
  return [
    {
      id: "cc-1",
      titleRu: "Почему контур сжимает окно",
      links: [
        {
          causeRu: "Trend Radar: ускорение ниши",
          effectRu: "Temporal Strategy: короче стратегическое терпение у витрины",
          modules: ["trends", "temporalStrategy"],
        },
        {
          causeRu: "Initiative Engine: критический импульс",
          effectRu: "Execution Planner и Оркестратор: миссия с повышенной срочностью",
          modules: ["initiativeEngine", "executionPlanner", "executionOrchestrator"],
        },
        {
          causeRu: "Operations: перегрев очереди",
          effectRu: "Mission Control: усиление ядра и маршрутизации",
          modules: ["operations", "missionControl"],
        },
      ],
    },
    {
      id: "cc-2",
      titleRu: "Связь памяти и риска",
      links: [
        {
          causeRu: "Память: повтор структуры запуска",
          effectRu: "SEO: осторожность кластерного overlap",
          modules: ["memory", "seo"],
        },
        {
          causeRu: `Решение: ${decision.opportunityLabelRu.slice(0, 80)}`,
          effectRu: `Синтез: ${synthesis.biggestRiskRu.slice(0, 100)}`,
          modules: ["command", "missionControl"],
        },
      ],
    },
  ];
}

function buildInfluence(edges: readonly SignalEdge[]): ModuleInfluence[] {
  const incoming = new Map<FabricModuleKey, FabricModuleKey[]>();
  const outgoing = new Map<FabricModuleKey, FabricModuleKey[]>();
  for (const e of edges) {
    outgoing.set(e.from, [...(outgoing.get(e.from) ?? []), e.to]);
    incoming.set(e.to, [...(incoming.get(e.to) ?? []), e.from]);
  }
  return NODE_ORDER.map((module) => {
    const inc = incoming.get(module) ?? [];
    const outg = outgoing.get(module) ?? [];
    const influenceScore = clamp((inc.length + outg.length) * 14 + (outg.length > 3 ? 12 : 0));
    return {
      module,
      incoming: inc,
      outgoing: outg,
      influenceScore,
      noteRu:
        outg.length > 4
          ? "Высокая исходящая связность — узел задаёт темп соседям."
          : inc.length > 4
            ? "Много входящих импульсов — узел в фокусе контура."
            : "Связность умеренная; узел в тактовом режиме.",
    };
  });
}

function buildPropagations(edges: readonly SignalEdge[], pulseGeneration: number): SignalPropagation[] {
  const pick = edges.filter((e) => e.intensity > 44).slice(0, 6);
  return pick.map((e, i) => ({
    id: `prop-${e.id}-${pulseGeneration}-${i}`,
    path: [e.from, e.to] as const,
    headModule: e.from,
    tailModule: e.to,
    intensity: e.intensity,
    labelRu: `Прогулка сигнала ${i + 1}: ${e.labelRu}`,
  }));
}

function buildStream(events: readonly SignalEvent[]): SignalStreamEntry[] {
  return [...events]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((ev) => ({
      id: `st-${ev.id}`,
      at: ev.timestamp,
      type: ev.type,
      source: ev.source,
      targets: ev.targets,
      urgency: ev.urgency,
      confidence: ev.confidence,
      causeRu: ev.causeRu,
      effectRu: ev.effectRu,
      labelRu: ev.labelRu,
    }));
}

function logLines(events: readonly SignalEvent[], pulseGeneration: number): string[] {
  return events.slice(0, 6).map(
    (e) =>
      `[#${pulseGeneration}] ${e.labelRu}: ${e.source} → ${e.targets.slice(0, 3).join(", ")} · срочность ${e.urgency} · ${e.effectRu.slice(0, 90)}…`,
  );
}

export type BuildSignalFabricInput = {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  initiatives: readonly StrategicInitiative[];
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  pulseGeneration: number;
  temporal: TemporalStrategySnapshot;
  lastEvent: CognitivePulseEvent | null;
  brandDnaSurfaceActive: boolean;
  fabricMemory: FabricMemoryHints;
};

export function buildSignalFabric(input: BuildSignalFabricInput): SignalFabricSnapshot {
  const { synthesis, decision, initiatives, modules, pulseGeneration, temporal, lastEvent, brandDnaSurfaceActive, fabricMemory } = input;
  void brandDnaSurfaceActive;

  const nodes = buildNodes(modules, initiatives, pulseGeneration);
  const edges = buildEdges(lastEvent, pulseGeneration);
  const events = buildEvents(synthesis, decision, temporal, initiatives, modules, fabricMemory, pulseGeneration);
  const pressures = buildPressureMap(decision, synthesis, temporal, modules, fabricMemory);
  const conflicts = buildConflicts(modules, decision, pulseGeneration);
  const cascades = buildCascades(synthesis, temporal, initiatives);
  const causalChains = buildCausalChains(decision, synthesis);
  const propagations = buildPropagations(edges, pulseGeneration);
  const moduleInfluence = buildInfluence(edges);
  const stream = buildStream(events);
  const corePressure = clamp(
    Math.round(
      synthesis.pressureIndex * 0.45 +
        modPressure(modules, "missionControl") * 0.35 +
        (lastEvent ? 14 : 0) +
        pressures.execution * 0.12,
    ),
  );

  return {
    generatedAt: Date.now(),
    pulseGeneration,
    nodes,
    edges,
    events,
    propagations,
    pressures,
    conflicts,
    cascades,
    moduleInfluence,
    causalChains,
    stream,
    corePressure,
    propagationLogRu: logLines(events, pulseGeneration),
  };
}
