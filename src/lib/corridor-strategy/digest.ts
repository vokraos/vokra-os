import { buildFboFbsDecisionReport } from "../fbo-fbs-decision";
import { deriveSnapshotIntelligence, getActiveEntitySnapshot } from "../entity-snapshot";
import { buildScalingSafetyReport } from "../scaling-safety";
import { buildAllCorridorStrategyReports, pickPrimaryCorridorReport } from "./recommendations";
import type { CorridorStrategyGlobalContext, CorridorStrategyReport } from "./types";

export const CORRIDOR_STRATEGY_EVENT = "vokra:corridor-strategy-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function gatherCorridorStrategyContext(t: TFn): CorridorStrategyGlobalContext {
  const snapshot = getActiveEntitySnapshot();
  const intel = snapshot ? deriveSnapshotIntelligence(snapshot) : null;
  const maxCorridorTotal = intel?.corridorSummary[0]?.total ?? 1;
  return {
    snapshot,
    intel,
    marketplace: "WB/Ozon",
    scalingReport: buildScalingSafetyReport(t),
    fboReport: buildFboFbsDecisionReport(t),
    maxCorridorTotal: Math.max(1, maxCorridorTotal),
  };
}

export function buildCorridorStrategyReports(t: TFn): CorridorStrategyReport[] {
  return buildAllCorridorStrategyReports(gatherCorridorStrategyContext(t));
}

export function buildPrimaryCorridorStrategyReport(t: TFn): CorridorStrategyReport | null {
  return pickPrimaryCorridorReport(buildCorridorStrategyReports(t));
}

export function notifyCorridorStrategyUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CORRIDOR_STRATEGY_EVENT));
}
