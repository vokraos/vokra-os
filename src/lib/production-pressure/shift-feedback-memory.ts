import { getProductionShiftLearning } from "./shift-feedback-learning";
import {
  PRODUCTION_SHIFT_FEEDBACK_MEMORY_SCHEMA,
  type ProductionShiftFeedback,
  type ProductionShiftFeedbackMemoryPayload,
} from "./shift-feedback-types";
import { parseProductionPressureMemoryPayload } from "./memoryPayload";
import { restoreProductionShiftFeedbackFromMemory } from "./shift-feedback-store";
import { primeSessionsFromProductionPressureMemoryPayload } from "./session";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function buildProductionShiftFeedbackMemoryPayload(
  feedback: ProductionShiftFeedback,
  extras?: { dailyPlanId?: string | null; embeddedPressureJson?: string },
): ProductionShiftFeedbackMemoryPayload {
  return {
    schema: PRODUCTION_SHIFT_FEEDBACK_MEMORY_SCHEMA,
    savedAt: Date.now(),
    feedback,
    dailyPlanId: extras?.dailyPlanId ?? feedback.sourceDailyPlanId,
    learningSummary: getProductionShiftLearning(),
    report: extras?.embeddedPressureJson ? JSON.parse(extras.embeddedPressureJson) : undefined,
  };
}

export function parseProductionShiftFeedbackMemoryPayload(
  raw: string,
): ProductionShiftFeedbackMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== PRODUCTION_SHIFT_FEEDBACK_MEMORY_SCHEMA || !isRecord(o.feedback)) {
      return null;
    }
    const feedback = o.feedback as ProductionShiftFeedback;
    if (typeof feedback.id !== "string") return null;
    return {
      schema: PRODUCTION_SHIFT_FEEDBACK_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      feedback,
      dailyPlanId: typeof o.dailyPlanId === "string" ? o.dailyPlanId : null,
      learningSummary: isRecord(o.learningSummary)
        ? (o.learningSummary as ProductionShiftFeedbackMemoryPayload["learningSummary"])
        : undefined,
      report: o.report,
    };
  } catch {
    return null;
  }
}

export function primeSessionsFromProductionShiftFeedbackMemoryPayload(
  payload: ProductionShiftFeedbackMemoryPayload,
): void {
  restoreProductionShiftFeedbackFromMemory([payload.feedback]);
  if (payload.report) {
    const embedded =
      typeof payload.report === "string"
        ? parseProductionPressureMemoryPayload(payload.report)
        : parseProductionPressureMemoryPayload(JSON.stringify(payload.report));
    if (embedded) primeSessionsFromProductionPressureMemoryPayload(embedded);
  }
}
