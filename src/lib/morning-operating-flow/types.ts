import type { NavId } from "../../types";
import type { DailyWarRoomSnapshot } from "../daily-war-room/types";
import type { OperatingRoleMode } from "../operating-role-mode/types";

export const MORNING_FLOW_MEMORY_SCHEMA = "vokra.morningFlow.v1" as const;
export const MORNING_FLOW_EVENT = "vokra:morning-flow-updated" as const;

export const MORNING_FLOW_STEP_IDS = [
  "open_war_room",
  "confirm_role_mode",
  "check_production_capacity",
  "review_assortment_plan",
  "review_launch_risks",
  "review_hero_work",
  "prepare_operator_work_order",
  "save_start_snapshot",
] as const;

export type MorningFlowStepId = (typeof MORNING_FLOW_STEP_IDS)[number];

export type MorningFlowReadiness = "ready" | "needs_attention" | "blocked";

export type MorningFlowStepStatus = "pending" | "done" | "blocked";

export type MorningFlowStep = {
  id: MorningFlowStepId;
  status: MorningFlowStepStatus;
  navId: NavId;
  titleKey: string;
  whyKey: string;
  hintKey?: string;
  hintVars?: Record<string, string>;
};

export type MorningOperatingFlow = {
  id: string;
  createdAt: number;
  dateLabel: string;
  dateKey: string;
  roleMode: OperatingRoleMode;
  currentStep: MorningFlowStepId;
  completedSteps: MorningFlowStepId[];
  blockedSteps: MorningFlowStepId[];
  readiness: MorningFlowReadiness;
  startSnapshot: DailyWarRoomSnapshot | null;
  nextAction: { text: string; navId: NavId };
  confidenceNote: string;
  steps: MorningFlowStep[];
  workOrderReady: boolean;
  workOrderTaskCount: number;
  isComplete: boolean;
};

export type MorningFlowMemoryPayload = {
  schema: typeof MORNING_FLOW_MEMORY_SCHEMA;
  savedAt: number;
  flow: MorningOperatingFlow;
  progress: {
    dateKey: string;
    completedSteps: MorningFlowStepId[];
    blockedSteps: MorningFlowStepId[];
    startSnapshot: DailyWarRoomSnapshot | null;
  };
};
