import type { DecisionEngineState, CognitiveSynthesisState } from "../cognitive-os/types";
import type { StrategicInitiative } from "../initiative-engine/types";
import type { ExecutionRoute, ExecutionRouteKind, ResourcePressure } from "../execution-orchestrator/types";
import type { TemporalStrategySnapshot } from "../temporal-strategy/types";
import { buildTimePressureRows } from "../operational-timing";
import type { BusinessImpactState } from "./types";

export type BusinessImpactInput = {
  synthesis: CognitiveSynthesisState;
  decision: DecisionEngineState;
  temporal: TemporalStrategySnapshot;
  operationalDrag: number;
  executionConfidence: number;
  resourcePressure: ResourcePressure;
  initiatives: readonly StrategicInitiative[];
  primaryRoute: ExecutionRoute | null;
};

export function deriveDominantBusinessImpact(input: BusinessImpactInput): BusinessImpactState {
  const { synthesis, decision, temporal, operationalDrag, executionConfidence, resourcePressure, initiatives } = input;
  const { phase, decay, patienceScore, recommendedTiming } = temporal;
  const s = synthesis;
  const d = decision;

  if (d.riskProductionOverload > 62 || resourcePressure.packagingBottleneck > 68) return "drag";
  if (s.regime === "saturation" && (decay.seoSaturation > 58 || d.riskSaturationProb > 58)) return "saturation";
  if (phase === "reinvention" || recommendedTiming === "reinvent_concept") return "recovery";
  if (decay.ctrFatigue > 58 || decay.visualFatigue > 58) return "decay";
  if (operationalDrag < 44 && s.launchReadiness > 56 && executionConfidence > 54) return "leverage";
  if (operationalDrag > 58 || initiatives.length > 5) return "drag";
  if (phase === "peak" || phase === "acceleration") return "acceleration";
  if (phase === "fatigue" || phase === "decline") return "erosion";
  if (phase === "emergence" && patienceScore > 55) return "stabilization";
  if (recommendedTiming === "stop_expansion" || recommendedTiming === "wait") return "stabilization";
  return "leverage";
}

export function buildLeverageLineKeys(input: BusinessImpactInput): string[] {
  const keys: string[] = [];
  const { synthesis, decision, temporal, operationalDrag, executionConfidence, primaryRoute } = input;

  if (synthesis.launchReadiness >= 56 && operationalDrag < 52) keys.push("biz.leverage.readyCorridor");
  if (executionConfidence >= 58 && primaryRoute?.routeState === "synchronized") keys.push("biz.leverage.syncRoute");
  if (temporal.recommendedTiming === "scale_fbo") keys.push("biz.leverage.fboWindow");
  if (decision.rank.seoLeverage > 62 && temporal.decay.seoSaturation < 52) keys.push("biz.leverage.seoDisciplined");
  if (temporal.recommendedTiming === "refresh_visuals") keys.push("biz.leverage.heroRefresh");
  if (synthesis.regime === "opportunity" && decision.rank.saturationRisk < 50) keys.push("biz.leverage.marginHeadroom");
  if (keys.length === 0) keys.push("biz.leverage.default");
  return keys.slice(0, 4);
}

export function buildDragLineKeys(input: BusinessImpactInput): string[] {
  const keys: string[] = [];
  const { synthesis, decision, initiatives, resourcePressure, operationalDrag } = input;

  if (initiatives.length >= 4) keys.push("biz.drag.parallelSurface");
  if (decision.riskProductionOverload > 48) keys.push("biz.drag.productionOverload");
  if (resourcePressure.skuComplexity > 58) keys.push("biz.drag.skuEntropy");
  if (resourcePressure.packagingBottleneck > 55) keys.push("biz.drag.packaging");
  if (resourcePressure.campaignPressure > 58) keys.push("biz.drag.promoSupport");
  if (synthesis.pressureIndex > 60 && operationalDrag > 52) keys.push("biz.drag.momentumDrag");
  if (keys.length === 0) keys.push("biz.drag.default");
  return keys.slice(0, 4);
}

export function buildWhatIfKeys(input: BusinessImpactInput): string[] {
  const keys: string[] = [];
  const { synthesis, decision, temporal } = input;

  if (synthesis.launchReadiness < 48) keys.push("biz.whatIf.delayLaunch");
  if (patienceScoreTooHigh(temporal) && synthesis.regime === "opportunity") keys.push("biz.whatIf.earlyScale");
  if (decision.riskProductionOverload > 54) keys.push("biz.whatIf.overloadContinues");
  if (decision.riskCtrFatigue > 50) keys.push("biz.whatIf.heroStale");
  if (temporal.decay.seoSaturation > 54) keys.push("biz.whatIf.seoAggressive");
  return keys.slice(0, 5);
}

function patienceScoreTooHigh(temporal: TemporalStrategySnapshot): boolean {
  return temporal.patienceScore > 62;
}

export type CostOfDelayRow = { id: string; bodyRu: string };

export function buildCostOfDelayRows(input: BusinessImpactInput): readonly CostOfDelayRow[] {
  const rows = buildTimePressureRows({
    temporal: input.temporal,
    synthesis: input.synthesis,
    resourcePressure: input.resourcePressure,
    operationalDrag: input.operationalDrag,
    primaryRoute: input.primaryRoute,
  });
  const costly = rows.filter((r) => r.posture === "delayed" || r.posture === "stale" || r.posture === "expired");
  if (costly.length) return costly.map((r) => ({ id: r.id, bodyRu: r.bodyRu }));
  return rows.slice(0, 3).map((r) => ({ id: r.id, bodyRu: r.bodyRu }));
}

/** i18n key: biz.orch.consequence.<kind> */
export function routeBusinessConsequenceKey(route: ExecutionRoute): `biz.orch.consequence.${ExecutionRouteKind}` {
  return `biz.orch.consequence.${route.kind}`;
}
