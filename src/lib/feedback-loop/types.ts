/**
 * Feedback Loop Engine — learning from execution, outcomes, and contour signals.
 * Russian-first copy in UI; technical terms (CTR, SEO, SKU, DTF, FBO, WB, Ozon) allowed.
 */

export type FeedbackEventKind =
  | "success"
  | "weak_signal"
  | "failure"
  | "bottleneck"
  | "drift"
  | "saturation"
  | "efficiency_gain"
  | "margin_improvement"
  | "brand_fit_improvement";

export const FEEDBACK_EVENT_KIND_RU: Record<FeedbackEventKind, string> = {
  success: "успех",
  weak_signal: "слабый сигнал",
  failure: "срыв",
  bottleneck: "узкое место",
  drift: "дрейф",
  saturation: "насыщение",
  efficiency_gain: "рост эффективности",
  margin_improvement: "улучшение маржи",
  brand_fit_improvement: "улучшение brand fit",
};

export type FeedbackEvent = {
  id: string;
  source: string;
  linkedCommandId: string | null;
  linkedRouteId: string | null;
  metric: string;
  beforeValue: string;
  afterValue: string;
  interpretationRu: string;
  impactRu: string;
  /** −100…+100, applied as learning delta to contour confidence */
  confidenceAdjustment: number;
  memoryTag: string;
  recommendationUpdateRu: string;
  createdAt: number;
  kind: FeedbackEventKind;
};

export type ExecutionResult = {
  id: string;
  labelRu: string;
  skuOrScopeRu: string;
  metric: string;
  outcomeRu: string;
  learnedRu: string;
  at: number;
};

export type LearningPattern = {
  id: string;
  labelRu: string;
  /** 0–100 strength after feedback */
  strength: number;
  evidenceRu: string;
  trend: "strengthened" | "weakened";
};

export type PerformanceSignal = {
  id: string;
  axis: string;
  value: number;
  trendRu: string;
  source: string;
};

export type OutcomeMemory = {
  summaryRu: string;
  echoesRu: readonly string[];
  lastCorrectionRu: string | null;
};

export type CorrectionRule = {
  id: string;
  conditionRu: string;
  actionRu: string;
  priority: number;
};

export type ConfidenceAdjustment = {
  axisRu: string;
  delta: number;
  reasonRu: string;
};

export type FeedbackLoopSnapshot = {
  generatedAt: number;
  pulseGeneration: number;
  events: readonly FeedbackEvent[];
  recentResults: readonly ExecutionResult[];
  systemLearnedRu: readonly string[];
  strengthenedPatterns: readonly LearningPattern[];
  weakenedHypotheses: readonly LearningPattern[];
  strategyCorrections: readonly CorrectionRule[];
  futureLaunchImpactRu: readonly string[];
  outcomeMemory: OutcomeMemory;
  performanceSignals: readonly PerformanceSignal[];
  confidenceAdjustments: readonly ConfidenceAdjustment[];
  /** Causal chain for UI (short lines, Russian) */
  causalChainRu: readonly string[];
};
