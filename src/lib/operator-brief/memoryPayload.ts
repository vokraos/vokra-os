import { translate } from "../i18n/localeStorage";
import type { AppLocale } from "../i18n/messages";
import { exportOperatorOverlay } from "./overlay";
import { buildOperatorWorkOrder } from "./work-order";
import {
  OPERATOR_BRIEF_MEMORY_SCHEMA,
  type OperatorBrief,
  type OperatorBriefMemoryPayload,
  type OperatorWorkOrder,
} from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseOperatorBriefMemoryPayload(raw: string): OperatorBriefMemoryPayload | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!isRecord(o) || o.schema !== OPERATOR_BRIEF_MEMORY_SCHEMA) return null;
    const brief = o.brief as OperatorBrief | undefined;
    if (!brief?.id) return null;
    const overlay = o.overlay;
    const workOrder = o.workOrder as OperatorWorkOrder | undefined;
    return {
      schema: OPERATOR_BRIEF_MEMORY_SCHEMA,
      savedAt: typeof o.savedAt === "number" ? o.savedAt : Date.now(),
      brief,
      workOrder: workOrder?.id
        ? workOrder
        : buildOperatorWorkOrder(brief, (k, v) => translate("en", k, v), "en"),
      overlay: overlay && typeof overlay === "object" ? (overlay as OperatorBriefMemoryPayload["overlay"]) : exportOperatorOverlay(),
    };
  } catch {
    return null;
  }
}

export function buildOperatorBriefMemoryPayload(
  brief: OperatorBrief,
  t: TFn,
  locale: AppLocale,
  workOrderId?: string,
): OperatorBriefMemoryPayload {
  return {
    schema: OPERATOR_BRIEF_MEMORY_SCHEMA,
    savedAt: Date.now(),
    brief,
    workOrder: buildOperatorWorkOrder(brief, t, locale, workOrderId),
    overlay: exportOperatorOverlay(),
  };
}
