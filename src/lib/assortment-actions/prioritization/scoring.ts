import { deriveSnapshotIntelligence } from "../../entity-snapshot/intelligence";
import type { EntitySnapshot } from "../../entity-snapshot/types";
import type {
  AssortmentAction,
  AssortmentActionPriority,
  AssortmentPriorityDigest,
  ExecutiveQueueId,
  UrgencyBand,
} from "../types";
import { computeEffortScore, corridorIsMixedFbo } from "./effort";
import { computeLeverageScore } from "./leverage";
import { computeOperationalRisk, duplicateCodeClusters } from "./risk";
import { buildAssortmentExplainability } from "./explain";
import { scoreSingleAction } from "./queues";
import { loadEconomicGuardrails } from "../../economic-guardrails";
import { augmentAssortmentWithGuardrails } from "../../economic-guardrails/integration";
import { augmentAssortmentWithAdPressure, buildPrimaryAdvertisingPressureReport } from "../../ad-pressure";
import { augmentAssortmentWithMarketTiming } from "../../market-timing";
import { peekMarketTimingSession } from "../../market-timing/session";
import { augmentAssortmentWithCorridorStrategy } from "../../corridor-strategy";
import { peekCorridorStrategySession } from "../../corridor-strategy/session";
import { augmentAssortmentWithFboFbsDecision } from "../../fbo-fbs-decision";
import { peekFboFbsDecisionSession } from "../../fbo-fbs-decision/session";
import { augmentAssortmentWithScalingSafety } from "../../scaling-safety";
import { peekScalingSafetySession } from "../../scaling-safety/session";
import { augmentAssortmentWithProductionPressure } from "../../production-pressure";
import { peekProductionPressureSession } from "../../production-pressure/session";
import { augmentAssortmentWithPricePressure, buildPricePositioningForContext } from "../../price-positioning";
import { augmentAssortmentWithUnitEconomics, loadUnitEconomicsBundle } from "../../unit-economics";

export const ASSORTMENT_ECON_PLACEHOLDER: Pick<
  AssortmentAction,
  | "leverageScore"
  | "effortScore"
  | "operationalRisk"
  | "executionPressure"
  | "confidence"
  | "expectedOutcome"
  | "urgencyBand"
  | "executiveQueues"
  | "priorityReasons"
  | "leverageReasons"
  | "riskReasons"
  | "effortReasons"
  | "trustNote"
> = {
  leverageScore: 0,
  effortScore: 0,
  operationalRisk: 0,
  executionPressure: 0,
  confidence: 0,
  expectedOutcome: "structural_clarity",
  urgencyBand: "medium",
  executiveQueues: [],
  priorityReasons: [],
  leverageReasons: [],
  riskReasons: [],
  effortReasons: [],
  trustNote: "aa.trust.noSalesData",
};

function urgencySort(u: UrgencyBand): number {
  if (u === "critical") return 0;
  if (u === "elevated") return 1;
  if (u === "medium") return 2;
  return 3;
}

type CoreAction = Omit<
  AssortmentAction,
  | "leverageScore"
  | "effortScore"
  | "operationalRisk"
  | "executionPressure"
  | "confidence"
  | "expectedOutcome"
  | "urgencyBand"
  | "executiveQueues"
  | "priorityReasons"
  | "leverageReasons"
  | "riskReasons"
  | "effortReasons"
  | "trustNote"
>;

function stripEcon(a: AssortmentAction): CoreAction {
  const {
    leverageScore: _ls,
    effortScore: _es,
    operationalRisk: _or,
    executionPressure: _ep,
    confidence: _cf,
    expectedOutcome: _eo,
    urgencyBand: _ub,
    executiveQueues: _eq,
    priorityReasons: _pr,
    leverageReasons: _lr,
    riskReasons: _rr,
    effortReasons: _er,
    trustNote: _tn,
    ...core
  } = a;
  return core;
}

/** Attach economic profile + executive queues (structure-only heuristics). */
export function enrichAssortmentActions(snapshot: EntitySnapshot, actions: AssortmentAction[]): AssortmentAction[] {
  const intel = deriveSnapshotIntelligence(snapshot);
  const maxTouch = Math.max(1, snapshot.skuEntities.length + snapshot.cardEntities.length);
  const dupClusters = duplicateCodeClusters(snapshot.skuEntities);
  const unitBundle = loadUnitEconomicsBundle();
  const guardrails = loadEconomicGuardrails();
  const ssfReport = peekScalingSafetySession()?.report ?? null;
  const pprReport = peekProductionPressureSession()?.report ?? null;
  const ffdReport = peekFboFbsDecisionSession()?.report ?? null;
  const cstReports = peekCorridorStrategySession()?.reports ?? [];
  const mtmReports = peekMarketTimingSession()?.reports ?? [];

  const enriched = actions.map((a) => {
    const touched = a.affectedSkuIds.length + a.affectedCardIds.length;
    const leverageScore = computeLeverageScore(intel, {
      actionType: a.actionType,
      corridor: a.corridor,
      touched,
      maxTouch,
    });
    const effortScore = computeEffortScore({
      actionType: a.actionType,
      difficulty: a.difficulty,
      touched,
      maxTouch,
      mixedFboCorridor: corridorIsMixedFbo(intel, a.corridor),
    });
    const operationalRisk = computeOperationalRisk({
      actionType: a.actionType,
      category: a.category,
      priority: a.priority,
      marketplace: a.marketplace,
      duplicateClusters: dupClusters,
      titleKey: a.titleKey,
    });

    const core = stripEcon(a);
    const scored = scoreSingleAction(core, {
      leverageScore,
      effortScore,
      operationalRisk,
      maxTouch,
    });
    const partial: AssortmentAction = {
      ...core,
      ...scored,
      priorityReasons: [],
      leverageReasons: [],
      riskReasons: [],
      effortReasons: [],
      trustNote: "aa.trust.noSalesData",
    };
    const explain = buildAssortmentExplainability(intel, partial, dupClusters, maxTouch);
    let merged = { ...partial, ...explain };
    if (unitBundle.profiles.length || unitBundle.templates.length || unitBundle.assignments.length) {
      const ue = augmentAssortmentWithUnitEconomics(merged, unitBundle);
      if (ue.riskReasons?.length) merged = { ...merged, ...ue };
    }
    if (guardrails.length) {
      const gr = augmentAssortmentWithGuardrails(merged, guardrails);
      if (gr.riskReasons?.length) merged = { ...merged, ...gr };
    }
    const priceReport = buildPricePositioningForContext(
      { corridor: merged.corridor, marketplace: merged.marketplace },
      { corridor: merged.corridor },
    );
    const ppr = augmentAssortmentWithPricePressure(merged, priceReport);
    if (ppr.riskReasons?.length) merged = { ...merged, ...ppr };
    const adp = augmentAssortmentWithAdPressure(merged, buildPrimaryAdvertisingPressureReport());
    if (adp.riskReasons?.length) merged = { ...merged, ...adp };
    const ssf = augmentAssortmentWithScalingSafety(merged, ssfReport);
    if (ssf.riskReasons?.length) merged = { ...merged, ...ssf };
    const prodP = augmentAssortmentWithProductionPressure(merged, pprReport);
    if (prodP.riskReasons?.length) merged = { ...merged, ...prodP };
    const ffd = augmentAssortmentWithFboFbsDecision(merged, ffdReport);
    if (ffd.riskReasons?.length) merged = { ...merged, ...ffd };
    const cst = augmentAssortmentWithCorridorStrategy(merged, cstReports);
    if (cst.riskReasons?.length) merged = { ...merged, ...cst };
    const mtm = augmentAssortmentWithMarketTiming(merged, mtmReports);
    if (mtm.riskReasons?.length) merged = { ...merged, ...mtm };
    return merged;
  });

  return enriched.sort((a, b) => {
    const u = urgencySort(a.urgencyBand) - urgencySort(b.urgencyBand);
    if (u !== 0) return u;
    if (b.executionPressure !== a.executionPressure) return b.executionPressure - a.executionPressure;
    if (b.leverageScore !== a.leverageScore) return b.leverageScore - a.leverageScore;
    const order = (p: AssortmentActionPriority) => (p === "critical" ? 0 : p === "high" ? 1 : p === "medium" ? 2 : 3);
    const pr = order(a.priority) - order(b.priority);
    if (pr !== 0) return pr;
    return b.affectedSkuIds.length + b.affectedCardIds.length - (a.affectedSkuIds.length + a.affectedCardIds.length);
  });
}

const EMPTY_QUEUES = (): Record<ExecutiveQueueId, number> => ({
  quick_wins: 0,
  high_leverage: 0,
  safe_scaling: 0,
  requires_cleanup: 0,
  risky_expansion: 0,
  archive_candidates: 0,
});

const EMPTY_URGENCY = (): Record<UrgencyBand, number> => ({
  low: 0,
  medium: 0,
  elevated: 0,
  critical: 0,
});

export function buildAssortmentPriorityDigest(
  actions: readonly AssortmentAction[],
  corridorHints: Pick<AssortmentPriorityDigest, "safestLaunchCorridor" | "highestLeverageCorridor" | "highestDragCorridor">,
): AssortmentPriorityDigest {
  const queueCounts = EMPTY_QUEUES();
  const urgencyCounts = EMPTY_URGENCY();
  for (const a of actions) {
    urgencyCounts[a.urgencyBand] += 1;
    for (const q of a.executiveQueues) {
      queueCounts[q] += 1;
    }
  }
  const fresh = actions.filter((a) => a.status === "new");
  const top =
    [...fresh].sort((a, b) => {
      const u = urgencySort(a.urgencyBand) - urgencySort(b.urgencyBand);
      if (u !== 0) return u;
      return b.executionPressure - a.executionPressure || b.leverageScore - a.leverageScore;
    })[0] ?? null;

  return {
    queueCounts,
    urgencyCounts,
    topRecommendedActionId: top?.id ?? null,
    safestLaunchCorridor: corridorHints.safestLaunchCorridor,
    highestLeverageCorridor: corridorHints.highestLeverageCorridor,
    highestDragCorridor: corridorHints.highestDragCorridor,
  };
}
