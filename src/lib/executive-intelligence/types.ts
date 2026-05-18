/**
 * Executive Intelligence Core — unified executive cognition over VOKRA OS contours.
 * Russian-first UI; allowed: SEO, CTR, SKU, DTF, FBO, premium, noir, hero SKU.
 */

export type ExecutiveRegime =
  | "expansion"
  | "consolidation"
  | "silent_accumulation"
  | "controlled_aggression"
  | "premium_defense"
  | "recovery"
  | "observation";

export const EXECUTIVE_REGIME_RU: Record<ExecutiveRegime, string> = {
  expansion: "расширение",
  consolidation: "консолидация",
  silent_accumulation: "тихое накопление",
  controlled_aggression: "контролируемая агрессия",
  premium_defense: "защита premium",
  recovery: "восстановление",
  observation: "наблюдение",
};

export type StrategicPressureMap = {
  cells: readonly {
    id: string;
    axisRu: string;
    value: number;
    noteRu: string;
  }[];
};

export type CognitiveConflict = {
  id: string;
  titleRu: string;
  poleARu: string;
  poleBRu: string;
  severity: number;
  resolutionHintRu: string;
};

export type StrategicContradiction = {
  id: string;
  summaryRu: string;
  tensionRu: string;
  severity: number;
};

export type ExecutivePriority = {
  id: string;
  labelRu: string;
  fromRu: string;
  toRu: string;
  urgency: number;
};

export type MetaSignal = {
  id: string;
  source: string;
  digestRu: string;
  weight: number;
};

export type ExecutiveDirective = {
  id: string;
  directiveRu: string;
  rationaleRu: string;
  /** Where contour applies this directive (narrative modules) */
  feedsIntoRu: readonly string[];
};

export type SystemConsensus = {
  id: string;
  statementRu: string;
  cohesion: number;
};

export type GlobalRiskVector = {
  id: string;
  domainRu: string;
  magnitude: number;
  concentrationRu: string;
};

export type ExecutiveConfidence = {
  ecosystemStability: number;
  expansionConfidence: number;
  narrativeCoherence: number;
  summaryRu: string;
};

export type ExecutiveSnapshot = {
  generatedAt: number;
  pulseGeneration: number;
  regime: ExecutiveRegime;
  regimeExplanationRu: string;
  strategicContradictions: readonly StrategicContradiction[];
  cognitiveConflicts: readonly CognitiveConflict[];
  pressureMap: StrategicPressureMap;
  directives: readonly ExecutiveDirective[];
  stabilityIndex: number;
  stabilityCaptionRu: string;
  priorityShifts: readonly ExecutivePriority[];
  riskConcentration: readonly GlobalRiskVector[];
  consensus: readonly SystemConsensus[];
  executiveConfidence: ExecutiveConfidence;
  expansionConfidenceExplanationRu: string;
  longHorizonAlignmentRu: readonly string[];
  metaSignals: readonly MetaSignal[];
};
