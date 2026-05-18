import { lsGet, lsSet } from "../storage";
import { OPERATOR_BRIEF_EVENT } from "./types";
import { OPERATOR_BRIEF_OVERLAY_KEY, type OperatorBriefOverlay, type OperatorTaskStatus } from "./types";
import { operatorTaskKey, parseOperatorTaskKey } from "./task-key";
import type { OperatorTaskSource } from "./types";

function emptyOverlay(): OperatorBriefOverlay {
  return { schema: OPERATOR_BRIEF_OVERLAY_KEY, notes: "", byKey: {} };
}

export function loadOperatorBriefOverlay(): OperatorBriefOverlay {
  const raw = lsGet(OPERATOR_BRIEF_OVERLAY_KEY);
  if (!raw) return emptyOverlay();
  try {
    const o = JSON.parse(raw) as OperatorBriefOverlay;
    if (!o?.byKey) return emptyOverlay();
    return { schema: OPERATOR_BRIEF_OVERLAY_KEY, notes: typeof o.notes === "string" ? o.notes : "", byKey: { ...o.byKey } };
  } catch {
    return emptyOverlay();
  }
}

function saveOverlay(o: OperatorBriefOverlay): void {
  try {
    lsSet(OPERATOR_BRIEF_OVERLAY_KEY, JSON.stringify(o));
    if (typeof window !== "undefined") window.dispatchEvent(new Event(OPERATOR_BRIEF_EVENT));
  } catch {
    /* quota */
  }
}

export function getOperatorOverlayStatus(source: OperatorTaskSource, id: string): OperatorTaskStatus | null {
  const row = loadOperatorBriefOverlay().byKey[operatorTaskKey(source, id)];
  return row?.status ?? null;
}

export function setOperatorOverlayStatus(source: OperatorTaskSource, id: string, status: OperatorTaskStatus): void {
  const cur = loadOperatorBriefOverlay();
  const key = operatorTaskKey(source, id);
  cur.byKey[key] = { ...cur.byKey[key], status };
  saveOverlay(cur);
}

export function setOperatorBriefNotes(notes: string): void {
  const cur = loadOperatorBriefOverlay();
  cur.notes = notes;
  saveOverlay(cur);
}

export function mergeOperatorOverlayFromMemory(overlay: OperatorBriefOverlay): void {
  if (!overlay?.byKey) return;
  const cur = loadOperatorBriefOverlay();
  cur.notes = overlay.notes ?? cur.notes;
  for (const [k, v] of Object.entries(overlay.byKey)) {
    if (!parseOperatorTaskKey(k)) continue;
    cur.byKey[k] = { ...cur.byKey[k], ...v };
  }
  saveOverlay(cur);
}

export function exportOperatorOverlay(): OperatorBriefOverlay {
  return loadOperatorBriefOverlay();
}
