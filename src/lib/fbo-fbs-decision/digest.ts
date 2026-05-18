import { gatherFboFbsDecisionContext } from "./gather";
import { deriveFboFbsDecision } from "./derive";
import { formatFboFbsDailyLine } from "./integration";
import type { FboFbsDecisionReport } from "./types";

export const FBO_FBS_DECISION_EVENT = "vokra:fbo-fbs-decision-updated" as const;

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildFboFbsDecisionReport(t: TFn, existingId?: string): FboFbsDecisionReport {
  return deriveFboFbsDecision(gatherFboFbsDecisionContext(t), existingId);
}

export function getFboFbsDecisionDailyLine(t: TFn): string | null {
  return formatFboFbsDailyLine(buildFboFbsDecisionReport(t), t);
}

export function notifyFboFbsDecisionUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(FBO_FBS_DECISION_EVENT));
}
