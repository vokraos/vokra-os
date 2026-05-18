import type { NavId } from "../../types";
import type { DailyPilotStepId } from "./types";

export const DAILY_PILOT_STEP_ORDER: readonly DailyPilotStepId[] = [
  "run_release_check",
  "complete_morning_start",
  "open_war_room",
  "copy_operator_work_order",
  "check_production_pressure",
  "run_operator_mode",
  "collect_execution_feedback",
  "collect_shift_feedback",
  "complete_evening_close",
  "review_next_morning_preload",
] as const;

export const DAILY_PILOT_STEPS: readonly {
  id: DailyPilotStepId;
  /** Primary screen for this step. */
  nav?: NavId;
}[] = [
  { id: "run_release_check", nav: "releaseCheck" },
  { id: "complete_morning_start", nav: "morningStart" },
  { id: "open_war_room", nav: "warRoom" },
  { id: "copy_operator_work_order", nav: "morningStart" },
  { id: "check_production_pressure", nav: "productionPressure" },
  { id: "run_operator_mode", nav: "operatorMode" },
  { id: "collect_execution_feedback", nav: "operatorMode" },
  { id: "collect_shift_feedback", nav: "productionPressure" },
  { id: "complete_evening_close", nav: "eveningClose" },
  { id: "review_next_morning_preload", nav: "morningStart" },
] as const;

export function dailyPilotStepNav(id: DailyPilotStepId): NavId | undefined {
  return DAILY_PILOT_STEPS.find((s) => s.id === id)?.nav;
}
