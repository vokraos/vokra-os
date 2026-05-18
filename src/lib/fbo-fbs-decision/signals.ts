import { peekFboFbsDecisionSession } from "./session";
import type { FboRecommendedMode } from "./types";

export type FboFbsSignals = {
  recommendedMode: FboRecommendedMode;
};

/** Cached FBO/FBS decision only — never builds a report. */
export function getFboFbsSignals(): FboFbsSignals | null {
  const report = peekFboFbsDecisionSession()?.report;
  if (!report) return null;
  return { recommendedMode: report.recommendedMode };
}
