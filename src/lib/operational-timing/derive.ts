import type { DecisionEngineState, CognitiveSynthesisState } from "../cognitive-os/types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type { ExecutionRoute, ExecutionStage, ResourcePressure } from "../execution-orchestrator/types";
import type { TemporalStrategySnapshot } from "../temporal-strategy/types";
import { TIMING_RECOMMENDATION_RU } from "../temporal-strategy/types";
import type { OperationalTimingState } from "./types";

export type InitiativeTimingInput = {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  temporal: Pick<TemporalStrategySnapshot, "phase" | "patienceScore" | "decay" | "recommendedTiming">;
  operationalDrag: number;
};

export function deriveStageOperationalTiming(stage: ExecutionStage): OperationalTimingState {
  const p = stage.pressure;
  const c = stage.confidence;
  const st = stage.status;

  if (p >= 76) return "overloaded";
  if (st === "exhausted" || st === "completed") return "expired";
  if (st === "blocked") return "delayed";
  if (st === "paused") return "cooling";
  if (st === "waiting") return p > 52 ? "stale" : "waiting";
  if (st === "synchronized" || st === "production_ready") return c >= 56 ? "synchronized" : "waiting";
  if (st === "active" || st === "scaling") return "active";
  return "waiting";
}

export function deriveRouteOperationalTiming(route: ExecutionRoute): OperationalTimingState {
  const st = route.routeState;
  const avgP =
    route.sequence.stages.length > 0
      ? route.sequence.stages.reduce((a, s) => a + s.pressure, 0) / route.sequence.stages.length
      : 50;

  if (st === "exhausted" || st === "completed") return "expired";
  if (st === "blocked") return "delayed";
  if (st === "paused") return "cooling";
  if (st === "waiting") return avgP > 54 ? "stale" : "waiting";
  if (st === "synchronized" || st === "production_ready") return route.confidence >= 55 ? "synchronized" : "waiting";
  if (st === "active" || st === "scaling") return avgP >= 74 ? "overloaded" : "active";
  return "waiting";
}

export function deriveInitiativeOperationalTiming(i: StrategicInitiative, input: InitiativeTimingInput): OperationalTimingState {
  const { synthesis, decision, temporal, operationalDrag } = input;
  const { launchReadiness, pressureIndex, regime } = synthesis;
  const { riskCtrFatigue, riskProductionOverload, riskBrandDilution, riskSaturationProb } = decision;
  const { phase, patienceScore, decay, recommendedTiming } = temporal;

  if ((i.kind === "production" || i.kind === "resource") && riskProductionOverload > 60) return "overloaded";
  if (i.kind === "risk" && riskCtrFatigue > 68 && pressureIndex > 54) return "overloaded";

  if (i.priority === "observe" && i.leverage < 30 && regime === "saturation") return "expired";

  if ((i.priority === "critical" || i.priority === "high_leverage") && launchReadiness < 46) return "delayed";

  if (i.kind === "risk" && riskCtrFatigue > 50) return "stale";
  if (i.kind === "seo" && decay.seoSaturation > 56) return "stale";

  if ((phase === "fatigue" || phase === "decline") && (i.kind === "production" || i.kind === "brand_integrity")) return "cooling";
  if (i.kind === "brand_integrity" && i.priority !== "critical") return "cooling";

  if (
    i.kind === "opportunity" &&
    launchReadiness >= 58 &&
    operationalDrag < 50 &&
    recommendedTiming !== "wait" &&
    patienceScore < 72
  ) {
    return "synchronized";
  }

  if (recommendedTiming === "wait" && i.kind === "opportunity") return "waiting";
  if (patienceScore > 64 && i.kind === "opportunity") return "waiting";

  if (i.priority === "critical" || i.priority === "high_leverage") return "active";

  if (riskSaturationProb > 58 && i.kind === "opportunity") return "waiting";

  if (i.priority === "strategic") return riskBrandDilution > 55 ? "delayed" : "waiting";

  return "waiting";
}

export type TimePressureRow = {
  id: string;
  bodyRu: string;
  posture: OperationalTimingState;
};

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t.length) return "—";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function riskWindowPosture(temporal: TemporalStrategySnapshot, synthesis: CognitiveSynthesisState): OperationalTimingState {
  if (temporal.patienceScore < 36 && synthesis.launchReadiness < 52) return "delayed";
  if (temporal.decay.ctrFatigue > 62 || temporal.decay.visualFatigue > 60) return "stale";
  if (temporal.phase === "decline" || temporal.phase === "fatigue") return "cooling";
  return "waiting";
}

function launchWindowPosture(temporal: TemporalStrategySnapshot, synthesis: CognitiveSynthesisState): OperationalTimingState {
  if (synthesis.launchReadiness >= 58 && temporal.patienceScore < 70) return "synchronized";
  if (synthesis.launchReadiness < 44) return "delayed";
  if (temporal.recommendedTiming === "wait") return "waiting";
  return "active";
}

export function buildTimePressureRows(args: {
  temporal: TemporalStrategySnapshot;
  synthesis: CognitiveSynthesisState;
  resourcePressure: ResourcePressure;
  operationalDrag: number;
  primaryRoute: ExecutionRoute | null;
}): readonly TimePressureRow[] {
  const { temporal, synthesis, resourcePressure, operationalDrag, primaryRoute } = args;
  const rows: TimePressureRow[] = [];

  rows.push({
    id: "tp-risk-window",
    bodyRu: clip(temporal.nextRiskWindowRu, 118),
    posture: riskWindowPosture(temporal, synthesis),
  });

  rows.push({
    id: "tp-launch-window",
    bodyRu: clip(temporal.bestLaunchWindowRu, 118),
    posture: launchWindowPosture(temporal, synthesis),
  });

  if (temporal.decay.ctrFatigue > 48 || temporal.decay.visualFatigue > 48) {
    rows.push({
      id: "tp-fatigue",
      bodyRu: clip(temporal.fatigueForecastRu, 118),
      posture: temporal.decay.ctrFatigue > 58 ? "stale" : "cooling",
    });
  }

  if (operationalDrag >= 52) {
    rows.push({
      id: "tp-drag",
      bodyRu: clip(resourcePressure.summaryRu, 118),
      posture: operationalDrag >= 68 ? "overloaded" : "delayed",
    });
  } else if (resourcePressure.fboReadiness < 48 || resourcePressure.seoBandwidth > 58) {
    rows.push({
      id: "tp-resource",
      bodyRu: clip(resourcePressure.summaryRu, 118),
      posture: resourcePressure.fboReadiness < 40 ? "delayed" : "stale",
    });
  }

  if (primaryRoute && primaryRoute.routeState === "blocked") {
    rows.push({
      id: "tp-route",
      bodyRu: clip(primaryRoute.objectiveRu, 100),
      posture: "delayed",
    });
  }

  return rows.slice(0, 6);
}

export type FollowUpItem = {
  id: string;
  lineRu: string;
  posture: OperationalTimingState;
};

export function buildFollowUpContinuity(args: {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  temporal: TemporalStrategySnapshot;
  primaryRoute: ExecutionRoute | null;
  resourcePressure: ResourcePressure;
}): readonly FollowUpItem[] {
  const { synthesis, decision, temporal, primaryRoute, resourcePressure } = args;
  const out: FollowUpItem[] = [];

  if (decision.riskCtrFatigue > 46) {
    out.push({
      id: "fu-ctr",
      lineRu: "Перепроверить CTR после визуального / hero-обновления.",
      posture: "active",
    });
  }

  if (resourcePressure.skuComplexity > 54 || decision.resourceSkuRu.length > 12) {
    out.push({
      id: "fu-sku",
      lineRu: "Пересверить SKU-кластер после rollout — матрица под давлением.",
      posture: "waiting",
    });
  }

  if (decision.riskBrandDilution > 50 || synthesis.regime === "saturation") {
    out.push({
      id: "fu-premium",
      lineRu: "Валидировать премиальный коридор после промо-давления.",
      posture: "cooling",
    });
  }

  if (decision.riskProductionOverload > 52 || resourcePressure.dtfQueue > 58) {
    out.push({
      id: "fu-overload",
      lineRu: "Мониторить перегруз производства после масштабирования серии.",
      posture: "overloaded",
    });
  }

  const topStage = primaryRoute?.sequence.stages.find((s) => s.status === "active" || s.status === "scaling");
  const touch = topStage?.tasks[0]?.labelRu;
  if (touch) {
    out.push({
      id: "fu-stage",
      lineRu: `Связать исполнение: ${clip(touch, 72)}`,
      posture: "synchronized",
    });
  }

  if (temporal.narrative.nextDropTimingRu.length > 8) {
    out.push({
      id: "fu-drop",
      lineRu: clip(`Сверка по таймингу дропа: ${temporal.narrative.nextDropTimingRu}`, 112),
      posture: "waiting",
    });
  }

  if (synthesis.memoryEchoRu && synthesis.memoryEchoRu.length > 10) {
    out.push({
      id: "fu-memory",
      lineRu: clip(synthesis.memoryEchoRu, 110),
      posture: "stale",
    });
  }

  if (!out.length) {
    out.push({
      id: "fu-default",
      lineRu: clip(`Свести контур с окном риска: ${temporal.nextRiskWindowRu}`, 118),
      posture: "waiting",
    });
  }

  return out.slice(0, 6);
}

export type TodayTemporalSlice = {
  staleLine: string;
  closingWindowLine: string;
  tooEarlyLine: string;
  accelerateLine: string;
};

export function buildTodayTemporalSlice(args: {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  temporal: TemporalStrategySnapshot;
  operationalDrag: number;
}): TodayTemporalSlice {
  const { synthesis, decision, temporal, operationalDrag } = args;

  const staleLine =
    temporal.decay.ctrFatigue > 55 || temporal.decay.visualFatigue > 54
      ? clip(temporal.fatigueForecastRu, 108)
      : clip(synthesis.biggestRiskRu, 108);

  const closingWindowLine =
    synthesis.launchReadiness < 50 ? clip(temporal.nextRiskWindowRu, 108) : clip(decision.timingWindowRu, 108);

  const tooEarlyLine =
    temporal.patienceScore > 62
      ? clip(`Пауза контура: patience ${temporal.patienceScore}% · ${TIMING_RECOMMENDATION_RU[temporal.recommendedTiming]}`, 108)
      : clip(temporal.integration.initiativeSummaryRu, 108);

  const accelerateLine =
    synthesis.launchReadiness >= 58 && operationalDrag < 50 && temporal.patienceScore < 65
      ? clip(synthesis.topOpportunityRu || decision.priorityAccelerateRu, 108)
      : clip(
          `Ускорение ограничено: запуск ${synthesis.launchReadiness}% · drag ${Math.round(operationalDrag)}%`,
          108,
        );

  return { staleLine, closingWindowLine, tooEarlyLine, accelerateLine };
}
