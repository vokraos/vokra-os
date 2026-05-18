import { lsGet, lsSet } from "../storage";
import { operatorTaskKey } from "../operator-brief/task-key";
import type { OperatorTaskSource } from "../operator-brief/types";
import { EXECUTION_FEEDBACK_EVENT, EXECUTION_FEEDBACK_OVERLAY_KEY, type ExecutionFeedbackOverlay, type ExecutionFeedbackTaskFlags } from "./types";

function empty(): ExecutionFeedbackOverlay {
  return {
    schema: EXECUTION_FEEDBACK_OVERLAY_KEY,
    sourceWorkOrderId: null,
    operatorNotes: "",
    founderNotes: "",
    byTaskKey: {},
  };
}

export function loadExecutionFeedbackOverlay(): ExecutionFeedbackOverlay {
  const raw = lsGet(EXECUTION_FEEDBACK_OVERLAY_KEY);
  if (!raw) return empty();
  try {
    const o = JSON.parse(raw) as ExecutionFeedbackOverlay;
    if (!o?.byTaskKey) return empty();
    return {
      schema: EXECUTION_FEEDBACK_OVERLAY_KEY,
      sourceWorkOrderId: o.sourceWorkOrderId ?? null,
      operatorNotes: typeof o.operatorNotes === "string" ? o.operatorNotes : "",
      founderNotes: typeof o.founderNotes === "string" ? o.founderNotes : "",
      byTaskKey: { ...o.byTaskKey },
    };
  } catch {
    return empty();
  }
}

function save(o: ExecutionFeedbackOverlay): void {
  try {
    lsSet(EXECUTION_FEEDBACK_OVERLAY_KEY, JSON.stringify(o));
    if (typeof window !== "undefined") window.dispatchEvent(new Event(EXECUTION_FEEDBACK_EVENT));
  } catch {
    /* quota */
  }
}

export function bindExecutionFeedbackWorkOrder(workOrderId: string): void {
  const cur = loadExecutionFeedbackOverlay();
  if (cur.sourceWorkOrderId === workOrderId) return;
  cur.sourceWorkOrderId = workOrderId;
  save(cur);
}

export function getExecutionFeedbackTaskFlags(source: OperatorTaskSource, id: string): ExecutionFeedbackTaskFlags {
  return { ...loadExecutionFeedbackOverlay().byTaskKey[operatorTaskKey(source, id)] };
}

export function patchExecutionFeedbackTaskFlags(
  source: OperatorTaskSource,
  id: string,
  patch: ExecutionFeedbackTaskFlags,
): void {
  const cur = loadExecutionFeedbackOverlay();
  const key = operatorTaskKey(source, id);
  cur.byTaskKey[key] = { ...cur.byTaskKey[key], ...patch };
  save(cur);
}

export function setExecutionFeedbackOperatorNotes(notes: string): void {
  const cur = loadExecutionFeedbackOverlay();
  cur.operatorNotes = notes;
  save(cur);
}

export function setExecutionFeedbackFounderNotes(notes: string): void {
  const cur = loadExecutionFeedbackOverlay();
  cur.founderNotes = notes;
  save(cur);
}

export function mergeExecutionFeedbackOverlayFromMemory(overlay: ExecutionFeedbackOverlay): void {
  if (!overlay?.byTaskKey) return;
  const cur = loadExecutionFeedbackOverlay();
  cur.sourceWorkOrderId = overlay.sourceWorkOrderId ?? cur.sourceWorkOrderId;
  cur.operatorNotes = overlay.operatorNotes ?? cur.operatorNotes;
  cur.founderNotes = overlay.founderNotes ?? cur.founderNotes;
  for (const [k, v] of Object.entries(overlay.byTaskKey)) {
    cur.byTaskKey[k] = { ...cur.byTaskKey[k], ...v };
  }
  save(cur);
}

export function exportExecutionFeedbackOverlay(): ExecutionFeedbackOverlay {
  return loadExecutionFeedbackOverlay();
}
