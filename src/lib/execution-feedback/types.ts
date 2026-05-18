import type { OperatorTaskSource } from "../operator-brief/types";

export const EXECUTION_FEEDBACK_MEMORY_SCHEMA = "vokra.executionFeedback.v1" as const;
export const EXECUTION_FEEDBACK_OVERLAY_KEY = "vokra.executionFeedback.overlay.v1" as const;

export const EXECUTION_FEEDBACK_EVENT = "vokra:execution-feedback-updated" as const;

export type ExecutionFeedbackTaskItem = {
  taskKey: string;
  source: OperatorTaskSource;
  id: string;
  title: string;
};

export type ExecutionFeedbackTaskFlags = {
  unclear?: boolean;
  delayed?: boolean;
  repeatTomorrow?: boolean;
  note?: string;
};

export type ExecutionFeedbackOverlay = {
  schema: typeof EXECUTION_FEEDBACK_OVERLAY_KEY;
  sourceWorkOrderId: string | null;
  operatorNotes: string;
  founderNotes: string;
  byTaskKey: Record<string, ExecutionFeedbackTaskFlags>;
};

export type ExecutionFeedbackReport = {
  id: string;
  createdAt: number;
  sourceWorkOrderId: string | null;
  completedTasks: ExecutionFeedbackTaskItem[];
  blockedTasks: ExecutionFeedbackTaskItem[];
  unclearTasks: ExecutionFeedbackTaskItem[];
  delayedTasks: ExecutionFeedbackTaskItem[];
  repeatedTomorrow: ExecutionFeedbackTaskItem[];
  operatorNotes: string;
  founderNotes: string;
  operationalProblems: string[];
  recommendedFixes: string[];
  confidenceNoteKey: string;
};

export type ExecutionFeedbackMemoryPayload = {
  schema: typeof EXECUTION_FEEDBACK_MEMORY_SCHEMA;
  savedAt: number;
  report: ExecutionFeedbackReport;
  overlay: ExecutionFeedbackOverlay;
};

export type ExecutionFeedbackDigest = {
  lineKey: string;
  lineVars: Record<string, string>;
};
