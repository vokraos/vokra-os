import { exportExecutionFeedbackOverlay } from "./overlay";
import { EXECUTION_FEEDBACK_MEMORY_SCHEMA, type ExecutionFeedbackMemoryPayload, type ExecutionFeedbackReport } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseExecutionFeedbackMemoryPayload(raw: string): ExecutionFeedbackMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== EXECUTION_FEEDBACK_MEMORY_SCHEMA) return null;
    const report = o.report as ExecutionFeedbackReport | undefined;
    if (!report?.id) return null;
    const overlay = o.overlay;
    return {
      schema: EXECUTION_FEEDBACK_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      report,
      overlay:
        overlay && typeof overlay === "object"
          ? (overlay as ExecutionFeedbackMemoryPayload["overlay"])
          : exportExecutionFeedbackOverlay(),
    };
  } catch {
    return null;
  }
}

export function buildExecutionFeedbackMemoryPayload(report: ExecutionFeedbackReport): ExecutionFeedbackMemoryPayload {
  return {
    schema: EXECUTION_FEEDBACK_MEMORY_SCHEMA,
    savedAt: Date.now(),
    report,
    overlay: exportExecutionFeedbackOverlay(),
  };
}
