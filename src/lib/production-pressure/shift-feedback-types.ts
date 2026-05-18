export type CapacityMismatchType =
  | "launch_load_underestimated"
  | "fbo_prep_underestimated"
  | "visual_jobs_underestimated"
  | "card_jobs_underestimated"
  | "packaging_underestimated"
  | "blocked_tasks_underestimated"
  | "none";

export type ProductionShiftFeedback = {
  id: string;
  createdAt: number;
  sourceDailyPlanId: string | null;
  sourceReportId: string | null;
  activeScenarioId: string | null;
  shiftDate: string;
  completedFocus: string[];
  delayedItems: string[];
  bottlenecksFound: string[];
  overloadAreas: string[];
  capacityMismatch: CapacityMismatchType;
  operatorNotes: string;
  founderNotes: string;
  recommendedCapacityAdjustment: string;
  nextShiftRecommendation: string;
  confidenceNote: string;
};

export const PRODUCTION_SHIFT_FEEDBACK_MEMORY_SCHEMA = "vokra.productionShiftFeedback.v1" as const;

export type ProductionShiftFeedbackMemoryPayload = {
  schema: typeof PRODUCTION_SHIFT_FEEDBACK_MEMORY_SCHEMA;
  savedAt: number;
  feedback: ProductionShiftFeedback;
  dailyPlanId?: string | null;
  learningSummary?: ProductionShiftLearningSummary;
  report?: unknown;
};

export type ProductionShiftLearningSummary = {
  repeatedMismatch: CapacityMismatchType | null;
  repeatCount: number;
  digestLineKey: string | null;
  digestLineVars: Record<string, string>;
  recommendationKeys: string[];
  reliabilityNoteKey: string | null;
  nextShiftHintKey: string | null;
};

export const CAPACITY_MISMATCH_TYPES: CapacityMismatchType[] = [
  "launch_load_underestimated",
  "fbo_prep_underestimated",
  "visual_jobs_underestimated",
  "card_jobs_underestimated",
  "packaging_underestimated",
  "blocked_tasks_underestimated",
  "none",
];

export const OVERLOAD_AREA_OPTIONS = [
  "launch",
  "fbo",
  "visual",
  "cards",
  "packaging",
  "blocked",
  "refresh",
] as const;

export type OverloadAreaId = (typeof OVERLOAD_AREA_OPTIONS)[number];
