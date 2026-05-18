import type { NavId } from "../../types";

export const OPERATOR_BRIEF_MEMORY_SCHEMA = "vokra.operatorBrief.v1" as const;
export const OPERATOR_BRIEF_OVERLAY_KEY = "vokra.operatorBrief.overlay.v1" as const;

export const OPERATOR_BRIEF_EVENT = "vokra:operator-brief-updated" as const;

export type OperatorTaskStatus = "todo" | "done" | "blocked" | "deferred";

export type OperatorTaskSource =
  | "assortment"
  | "hero"
  | "collection"
  | "launch"
  | "visual"
  | "card"
  | "cleanup";

export type OperatorTask = {
  id: string;
  title: string;
  source: OperatorTaskSource;
  priority: "high" | "medium" | "low";
  status: OperatorTaskStatus;
  instruction: string;
  destination: NavId;
};

export type OperatorBrief = {
  id: string;
  createdAt: number;
  todayTasks: OperatorTask[];
  blockedTasks: OperatorTask[];
  visualTasks: OperatorTask[];
  cardTasks: OperatorTask[];
  launchTasks: OperatorTask[];
  dataCleanupTasks: OperatorTask[];
  notes: string;
  nextAction: OperatorTask | null;
  confidenceNoteKey: string;
};

export type OperatorTaskOverlay = {
  status?: OperatorTaskStatus;
  note?: string;
};

export type OperatorBriefOverlay = {
  schema: typeof OPERATOR_BRIEF_OVERLAY_KEY;
  notes: string;
  byKey: Record<string, OperatorTaskOverlay>;
};

export type OperatorWorkOrderLine = {
  label: string;
  detail?: string;
};

export type OperatorWorkOrder = {
  id: string;
  createdAt: number;
  dateLabel: string;
  priorityTasks: OperatorWorkOrderLine[];
  visualTasks: OperatorWorkOrderLine[];
  cardTasks: OperatorWorkOrderLine[];
  launchTasks: OperatorWorkOrderLine[];
  dataTasks: OperatorWorkOrderLine[];
  blockedItems: OperatorWorkOrderLine[];
  productionDoFirst: OperatorWorkOrderLine[];
  productionDelay: OperatorWorkOrderLine[];
  productionAvoid: OperatorWorkOrderLine[];
  productionBottleneckWatch: string[];
  warRoomTeamInstructions: OperatorWorkOrderLine[];
  warRoomWatchList: string[];
  warRoomBlockedItems: OperatorWorkOrderLine[];
  checkBeforeFinish: string[];
  reportBackQuestions: string[];
  notes: string;
};

export type OperatorBriefMemoryPayload = {
  schema: typeof OPERATOR_BRIEF_MEMORY_SCHEMA;
  savedAt: number;
  brief: OperatorBrief;
  workOrder: OperatorWorkOrder;
  overlay: OperatorBriefOverlay;
};
