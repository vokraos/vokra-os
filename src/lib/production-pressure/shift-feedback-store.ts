import { lsGet, lsSet } from "../storage";
import { PRODUCTION_PRESSURE_EVENT } from "./types";
import type { ProductionShiftFeedback } from "./shift-feedback-types";

export const PRODUCTION_SHIFT_FEEDBACK_STORAGE_KEY = "vokra.productionShift.feedback.v1" as const;
export const PRODUCTION_SHIFT_FEEDBACK_OVERLAY_KEY = "vokra.productionShift.feedback.overlay.v1" as const;

const MAX_ENTRIES = 40;

type FeedbackState = {
  entries: ProductionShiftFeedback[];
};

export type ProductionShiftFeedbackOverlay = {
  operatorNote: string;
  linkedDailyPlanId: string | null;
};

function emptyState(): FeedbackState {
  return { entries: [] };
}

export function newShiftFeedbackId(): string {
  return `psf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadProductionShiftFeedbackState(): FeedbackState {
  const raw = lsGet(PRODUCTION_SHIFT_FEEDBACK_STORAGE_KEY);
  if (!raw) return emptyState();
  try {
    const o = JSON.parse(raw) as FeedbackState;
    if (!Array.isArray(o.entries)) return emptyState();
    return { entries: o.entries.filter((e) => e && typeof e.id === "string") };
  } catch {
    return emptyState();
  }
}

function saveState(state: FeedbackState): void {
  try {
    lsSet(
      PRODUCTION_SHIFT_FEEDBACK_STORAGE_KEY,
      JSON.stringify({ entries: state.entries.slice(-MAX_ENTRIES) }),
    );
    if (typeof window !== "undefined") window.dispatchEvent(new Event(PRODUCTION_PRESSURE_EVENT));
  } catch {
    /* quota */
  }
}

export function appendProductionShiftFeedback(entry: ProductionShiftFeedback): void {
  const state = loadProductionShiftFeedbackState();
  state.entries.push(entry);
  saveState(state);
}

export function loadProductionShiftFeedbackOverlay(): ProductionShiftFeedbackOverlay {
  const raw = lsGet(PRODUCTION_SHIFT_FEEDBACK_OVERLAY_KEY);
  if (!raw) return { operatorNote: "", linkedDailyPlanId: null };
  try {
    const o = JSON.parse(raw) as ProductionShiftFeedbackOverlay;
    return {
      operatorNote: typeof o.operatorNote === "string" ? o.operatorNote : "",
      linkedDailyPlanId: typeof o.linkedDailyPlanId === "string" ? o.linkedDailyPlanId : null,
    };
  } catch {
    return { operatorNote: "", linkedDailyPlanId: null };
  }
}

export function setProductionShiftFeedbackOperatorNote(note: string, dailyPlanId?: string | null): void {
  try {
    lsSet(
      PRODUCTION_SHIFT_FEEDBACK_OVERLAY_KEY,
      JSON.stringify({
        operatorNote: note,
        linkedDailyPlanId: dailyPlanId ?? null,
      } satisfies ProductionShiftFeedbackOverlay),
    );
    if (typeof window !== "undefined") window.dispatchEvent(new Event(PRODUCTION_PRESSURE_EVENT));
  } catch {
    /* quota */
  }
}

export function clearProductionShiftFeedbackOperatorNote(): void {
  setProductionShiftFeedbackOperatorNote("", null);
}

export function restoreProductionShiftFeedbackFromMemory(entries: ProductionShiftFeedback[]): void {
  if (!entries.length) return;
  const state = loadProductionShiftFeedbackState();
  const ids = new Set(state.entries.map((e) => e.id));
  for (const e of entries) {
    if (!ids.has(e.id)) state.entries.push(e);
  }
  saveState(state);
}
