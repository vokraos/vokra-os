/** One-day operational validation pilot (manual; no extra intelligence). */

export type DailyPilotStepId =
  | "run_release_check"
  | "complete_morning_start"
  | "open_war_room"
  | "copy_operator_work_order"
  | "check_production_pressure"
  | "run_operator_mode"
  | "collect_execution_feedback"
  | "collect_shift_feedback"
  | "complete_evening_close"
  | "review_next_morning_preload";

export type DailyPilotVerdict =
  | "ready_for_daily_use"
  | "usable_with_friction"
  | "too_complex"
  | "blocked";

/** Keys for “useful / confusing” — map to nav labels in UI. */
export type DailyPilotScreenKey =
  | "release_check"
  | "morning_start"
  | "war_room"
  | "operator_mode"
  | "production_pressure"
  | "evening_close"
  | "daily_pilot";

export type DailyOperationsPilot = {
  id: string;
  createdAt: number;
  dateLabel: string;
  currentStep: DailyPilotStepId;
  completedSteps: DailyPilotStepId[];
  blockedSteps: DailyPilotStepId[];
  morningStatus: string;
  operatorStatus: string;
  productionStatus: string;
  feedbackStatus: string;
  eveningCloseStatus: string;
  usefulScreens: DailyPilotScreenKey[];
  confusingScreens: DailyPilotScreenKey[];
  frictionNotes: string;
  missingData: string;
  finalVerdict: DailyPilotVerdict;
  recommendedFixes: string;
  confidenceNote: string;
};
