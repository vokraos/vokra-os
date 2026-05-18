/** Strategic time intelligence — phases, horizons, decay, narrative (not a calendar). */

export type TemporalPhase =
  | "emergence"
  | "acceleration"
  | "peak"
  | "fatigue"
  | "decline"
  | "reinvention";

export type TemporalHorizonKey = "d7" | "d30" | "d90" | "seasonal" | "longTail";

export type TimingRecommendation =
  | "launch_now"
  | "test_quietly"
  | "wait"
  | "refresh_visuals"
  | "scale_fbo"
  | "stop_expansion"
  | "reinvent_concept";

export type TemporalDecaySnapshot = {
  ctrFatigue: number;
  visualFatigue: number;
  emotionalNoveltyDecay: number;
  seoSaturation: number;
  competitorImitation: number;
  productionOverload: number;
};

export type HorizonTrajectory = {
  horizon: TemporalHorizonKey;
  /** 0–100 narrative intensity */
  intensity: number;
  trajectoryRu: string;
  riskHintRu: string;
  opportunityRu: string;
};

export type TemporalTimelineCard = {
  id: string;
  horizon: TemporalHorizonKey;
  titleRu: string;
  bodyRu: string;
  emphasis: "low" | "mid" | "high";
};

export type NarrativeContinuity = {
  themeEvolutionRu: string;
  visualLanguageChangeRu: string;
  consistencyAnchorRu: string;
  nextDropTimingRu: string;
};

export type TemporalIntegrationSignals = {
  initiativeSummaryRu: string;
  memorySummaryRu: string;
  missionControlRu: string;
  trendRadarRu: string;
  strategicCommandRu: string;
};

export type TemporalStrategySnapshot = {
  generatedAt: number;
  pulseGeneration: number;
  phase: TemporalPhase;
  phaseConfidence: number;
  nextRiskWindowRu: string;
  bestLaunchWindowRu: string;
  fatigueForecastRu: string;
  horizons: readonly HorizonTrajectory[];
  decay: TemporalDecaySnapshot;
  recommendedTiming: TimingRecommendation;
  narrative: NarrativeContinuity;
  patienceScore: number;
  timelineCards: readonly TemporalTimelineCard[];
  integration: TemporalIntegrationSignals;
};

export type TemporalMemoryHints = {
  trendRadarCount: number;
  strategicCommandCount: number;
  recentTrendTitle: string | null;
};

export const TEMPORAL_PHASE_RU: Record<TemporalPhase, string> = {
  emergence: "зарождение",
  acceleration: "ускорение",
  peak: "пик",
  fatigue: "усталость",
  decline: "спад",
  reinvention: "переосмысление",
};

export const TIMING_RECOMMENDATION_RU: Record<TimingRecommendation, string> = {
  launch_now: "Запуск сейчас",
  test_quietly: "Тихий тест",
  wait: "Выждать",
  refresh_visuals: "Обновить визуал",
  scale_fbo: "Масштаб FBO",
  stop_expansion: "Остановить расширение",
  reinvent_concept: "Переизобрести концепт",
};
