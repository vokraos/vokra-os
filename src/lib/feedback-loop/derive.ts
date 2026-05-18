import type { NavId } from "../../types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type { CognitiveSynthesisState, DecisionEngineState, ModuleCognitiveSnapshot } from "../cognitive-os/types";
import type { TemporalStrategySnapshot } from "../temporal-strategy/types";
import type { SignalFabricSnapshot } from "../signal-fabric/types";
import type { ExecutionOrchestrationSnapshot } from "../execution-orchestrator/types";
import type {
  ConfidenceAdjustment,
  CorrectionRule,
  ExecutionResult,
  FeedbackEvent,
  FeedbackEventKind,
  FeedbackLoopSnapshot,
  LearningPattern,
  OutcomeMemory,
  PerformanceSignal,
} from "./types";
import { clamp, hashStr } from "../math";

export type BuildFeedbackLoopInput = {
  orchestration: ExecutionOrchestrationSnapshot;
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  initiatives: readonly StrategicInitiative[];
  temporal: TemporalStrategySnapshot;
  fabric: SignalFabricSnapshot | null;
  modules: Partial<Record<NavId, ModuleCognitiveSnapshot>>;
  pulseGeneration: number;
};

export function buildFeedbackLoop(input: BuildFeedbackLoopInput): FeedbackLoopSnapshot {
  const { orchestration, synthesis, decision, initiatives, temporal, fabric, modules, pulseGeneration } = input;
  const now = Date.now();
  const seed = hashStr(`fb-${pulseGeneration}`);
  const orch = orchestration;
  const cmds = orch.actionCommandLayer.commands;
  const topCmd = cmds.find((c) => c.id === orch.actionCommandLayer.topCommandId) ?? cmds[0];
  const route0 = orch.routes[0];
  const routeId = route0?.id ?? null;

  const events: FeedbackEvent[] = [];
  const pushEv = (
    id: string,
    kind: FeedbackEventKind,
    source: string,
    metric: string,
    before: string,
    after: string,
    interp: string,
    impact: string,
    adj: number,
    tag: string,
    rec: string,
    cmdId: string | null,
    routeId: string | null,
  ) => {
    events.push({
      id,
      kind,
      source,
      linkedCommandId: cmdId,
      linkedRouteId: routeId,
      metric,
      beforeValue: before,
      afterValue: after,
      interpretationRu: interp,
      impactRu: impact,
      confidenceAdjustment: adj,
      memoryTag: tag,
      recommendationUpdateRu: rec,
      createdAt: now - (events.length + 1) * 180_000,
    });
  };

  if (topCmd) {
    pushEv(
      `fe-cmd-${pulseGeneration}`,
      temporal.decay.ctrFatigue > 58 ? "weak_signal" : "success",
      "action_command",
      "CTR hero",
      `${Math.max(42, 72 - temporal.decay.ctrFatigue)}%`,
      `${clamp(72 - temporal.decay.ctrFatigue + (seed % 6))}%`,
      "Команда исполнения закрепила связь «визуал → карточка»; контур считает сигнал подтверждённым.",
      "Следующий запуск: сместить акцент на proof-motion, не расширять SKU без SEO-опоры.",
      temporal.decay.ctrFatigue > 58 ? -4 : 6,
      "ctr_hero_feedback",
      "Усилить стадию hero visual перед amplification.",
      topCmd.id,
      routeId,
    );
  }

  pushEv(
    `fe-seo-${pulseGeneration}`,
    decision.rank.seoLeverage < 52 ? "drift" : "efficiency_gain",
    "seo / temporal",
    "SEO leverage",
    `${decision.rank.seoLeverage}%`,
    `${clamp(decision.rank.seoLeverage + (seed % 5) - 2)}%`,
    "Temporal фиксирует семантическое окно; память исходов снижает агрессию кластера при overlap.",
    "Коррекция: удерживать entity-героя, не дробить long-tail на WB/Ozon.",
    decision.rank.seoLeverage < 52 ? -5 : 4,
    "seo_cluster_learning",
    "Зафиксировать кластер в Strategic Command перед расширением карточек.",
    cmds[5]?.id ?? null,
    routeId,
  );

  pushEv(
    `fe-prod-${pulseGeneration}`,
    orch.resourcePressure.dtfQueue > 62 ? "bottleneck" : "efficiency_gain",
    "operations",
    "DTF queue pressure",
    `${orch.resourcePressure.dtfQueue - 8}%`,
    `${orch.resourcePressure.dtfQueue}%`,
    "Производство: очередь дала откат по velocity; FBO readiness связан с depth стока.",
    "Правило: не параллелить FBO-волну при pressure > порога без Mission Control.",
    orch.resourcePressure.dtfQueue > 62 ? -8 : 3,
    "production_bottleneck_echo",
    "Сдвинуть FBO или снизить SKU entropy на 10–15%.",
    cmds[9]?.id ?? null,
    routeId,
  );

  if (fabric?.events[0]) {
    const ev = fabric.events[0]!;
    pushEv(
      `fe-sf-${pulseGeneration}`,
      "weak_signal",
      "signal_fabric",
      "Каскад",
      "observe",
      "routed",
      `Импульс ${ev.labelRu.slice(0, 48)}… закреплён в обратной связи.`,
      "Initiative Engine получит пониженный leverage при повторе паттерна.",
      -2,
      `sf_${ev.type.toLowerCase()}`,
      "Держать temporal окно без расширения кампаний.",
      null,
      routeId,
    );
  }

  if (initiatives.length > 0) {
    const ini = initiatives[0]!;
    pushEv(
      `fe-ini-${pulseGeneration}`,
      ini.priority === "critical" ? "failure" : "success",
      "initiative_engine",
      "Приоритет инициативы",
      "baseline",
      ini.priority,
      `Инициатива «${ini.headlineRu.slice(0, 40)}…» влияет на executive memory.`,
      "Strategic Command: пересчитать риск saturation при следующем пульсе.",
      ini.priority === "critical" ? -6 : 5,
      `init_${ini.id.slice(0, 8)}`,
      "Синхронизировать с Execution Orchestrator и командным слоем.",
      cmds.find((c) => c.id.startsWith("ac-init"))?.id ?? null,
      routeId,
    );
  }

  pushEv(
    `fe-dna-${pulseGeneration}`,
    modules.dna?.brandGate === "hold" ? "failure" : "brand_fit_improvement",
    "brand_dna",
    "Brand fit",
    modules.dna?.brandGate === "hold" ? "watch" : "ok",
    modules.dna?.brandGate === "hold" ? "hold" : "ok+",
    modules.dna?.brandGate === "hold"
      ? "DNA hold: визуал и кампании получили блокирующую обратную связь."
      : "DNA: когерентность героя подтверждена после последнего запуска.",
    modules.dna?.brandGate === "hold" ? "Задержка reels / campaign до снятия gate." : "Разрешено усиление reels при стабильном CTR.",
    modules.dna?.brandGate === "hold" ? -10 : 7,
    "dna_fit_feedback",
    "Проверить Brand DNA перед следующим hero refresh.",
    null,
    routeId,
  );

  pushEv(
    `fe-margin-${pulseGeneration}`,
    decision.riskPricingPressure > 55 ? "saturation" : "margin_improvement",
    "strategic_command",
    "Ценовое давление",
    `${decision.riskPricingPressure}%`,
    `${clamp(decision.riskPricingPressure - 3 + (seed % 4))}%`,
    "Командный центр: ценовой коридор скорректирован по velocity и return proxy.",
    "Следующие запуски: тест цены до масштаба FBO.",
    decision.riskPricingPressure > 55 ? -4 : 5,
    "pricing_learning",
    "Запустить протестировать цену на 1–2 SKU героя.",
    cmds[10]?.id ?? null,
    routeId,
  );

  const recentResults: ExecutionResult[] = [
    {
      id: `er-${pulseGeneration}-1`,
      labelRu: "Запуск героя · WB",
      skuOrScopeRu: (route0?.titleRu ?? "Маршрут").slice(0, 40),
      metric: "CTR / карточка",
      outcomeRu: temporal.decay.ctrFatigue > 55 ? "Слабее baseline; обучение зафиксировало drift." : "В коридоре; усиление SEO закреплено.",
      learnedRu: "Не масштабировать без refresh визуала.",
      at: now - 3600_000,
    },
    {
      id: `er-${pulseGeneration}-2`,
      labelRu: "FBO readiness",
      skuOrScopeRu: "FBO / depth",
      metric: "Готовность FBO",
      outcomeRu: `${orch.resourcePressure.fboReadiness}% после последней волны.`,
      learnedRu: "Связать depth с DTF окном.",
      at: now - 900_000,
    },
  ];

  const systemLearnedRu = [
    `Контур: ${synthesis.causeEffectRu ?? "причинность уточняется по сигналам памяти и temporal decay."}`.slice(0, 160),
    `Executive memory: ${decision.executiveMemoryRu.slice(0, 120)}…`,
    fabric ? `Signal Fabric: каскады ${fabric.cascades.length} · ядро ${fabric.corePressure}% участвуют в коррекции confidence.` : "Signal Fabric: частичный след — осторожность в рекомендациях.",
    `Temporal: CTR fatigue ${temporal.decay.ctrFatigue}% · SEO saturation ${temporal.decay.seoSaturation}% влияют на следующий launch window.`,
  ] as const;

  const strengthenedPatterns: LearningPattern[] = [
    {
      id: "lp-seo-anchor",
      labelRu: "SEO-якорь героя",
      strength: clamp(58 + (seed % 18)),
      evidenceRu: "Повторяющийся рост leverage при удержании entity без дробления SKU.",
      trend: "strengthened",
    },
    {
      id: "lp-dtf-throttle",
      labelRu: "Троттлинг DTF при перегреве",
      strength: clamp(52 + (seed % 12)),
      evidenceRu: "Снижение operational drag при переносе волны +7 дней.",
      trend: "strengthened",
    },
  ];

  const weakenedHypotheses: LearningPattern[] = [
    {
      id: "lp-fast-scale",
      labelRu: "Гипотеза fast-scale без FBO depth",
      strength: clamp(22 + (seed % 15)),
      evidenceRu: "Два цикла подряд: return proxy и FBO readiness не выдержали.",
      trend: "weakened",
    },
  ];

  const strategyCorrections: CorrectionRule[] = [
    {
      id: "cr-1",
      conditionRu: "CTR fatigue > 55 и campaign pressure высокие",
      actionRu: "Сначала hero visual + карточка, затем reels — не наоборот.",
      priority: 88,
    },
    {
      id: "cr-2",
      conditionRu: "DNA hold или brand dilution risk высокий",
      actionRu: "Стоп масштабирования кампаний до снятия gate.",
      priority: 92,
    },
    {
      id: "cr-3",
      conditionRu: "SEO leverage < 50",
      actionRu: "Сжать кластер и синхронизировать naming с памятью проекта.",
      priority: 76,
    },
  ];

  const futureLaunchImpactRu = [
    "Следующие запуски: +4% к confidence исполнения при соблюдении правила DTF→FBO.",
    "Риск saturation: −6% к агрессии кластера при overlap из памяти.",
    "Strategic Simulation получит обновлённый prior по velocity после фиксации исхода.",
  ] as const;

  const outcomeMemory: OutcomeMemory = {
    summaryRu: synthesis.memoryEchoRu.slice(0, 200) + (synthesis.memoryEchoRu.length > 200 ? "…" : ""),
    echoesRu: [
      orch.nextBestActionRu.slice(0, 90) + (orch.nextBestActionRu.length > 90 ? "…" : ""),
      decision.launch.expectedImpactRu.slice(0, 90) + (decision.launch.expectedImpactRu.length > 90 ? "…" : ""),
    ],
    lastCorrectionRu: strategyCorrections[0]!.actionRu,
  };

  const performanceSignals: PerformanceSignal[] = [
    {
      id: "ps-ctr",
      axis: "CTR",
      value: clamp(100 - temporal.decay.ctrFatigue),
      trendRu: temporal.decay.ctrFatigue > 52 ? "дрейф вниз" : "стабильно",
      source: "temporal_strategy",
    },
    {
      id: "ps-seo",
      axis: "SEO",
      value: decision.rank.seoLeverage,
      trendRu: decision.rank.seoLeverage < 50 ? "слабее" : "держит",
      source: "decision_engine",
    },
    {
      id: "ps-fbo",
      axis: "FBO readiness",
      value: orch.resourcePressure.fboReadiness,
      trendRu: orch.resourcePressure.fboReadiness < 48 ? "риск" : "в коридоре",
      source: "execution_orchestrator",
    },
    {
      id: "ps-vel",
      axis: "Sales velocity (proxy)",
      value: clamp(48 + synthesis.launchReadiness * 0.35),
      trendRu: synthesis.regime === "saturation" ? "давление" : "окно",
      source: "strategic_synthesis",
    },
  ];

  const confidenceAdjustments: ConfidenceAdjustment[] = [
    {
      axisRu: "Исполнение (launch readiness)",
      delta: clamp(Math.round((events.reduce((s, e) => s + e.confidenceAdjustment, 0) / Math.max(1, events.length)) * 1.2)),
      reasonRu: "Средневзвешенная коррекция по последним feedback events.",
    },
    {
      axisRu: "Brand DNA gate",
      delta: modules.dna?.brandGate === "hold" ? -12 : 4,
      reasonRu: modules.dna?.brandGate === "hold" ? "Hold усиливает консерватизм рекомендаций." : "OK — допуск на креатив без ужесточения.",
    },
  ];

  const causalChainRu = [
    "Исполненная команда → метрика CTR / карточка",
    "Signal Fabric + Temporal → интерпретация риска",
    "Initiative Engine + Command → коррекция приоритета",
    "Outcome Memory → следующий launch window и confidence",
  ] as const;

  events.sort((a, b) => b.createdAt - a.createdAt);

  return {
    generatedAt: now,
    pulseGeneration,
    events,
    recentResults,
    systemLearnedRu: [...systemLearnedRu],
    strengthenedPatterns,
    weakenedHypotheses,
    strategyCorrections,
    futureLaunchImpactRu: [...futureLaunchImpactRu],
    outcomeMemory,
    performanceSignals,
    confidenceAdjustments,
    causalChainRu: [...causalChainRu],
  };
}
