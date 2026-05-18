import { lsGet, lsSet } from "../storage";
import {
  ASSORTMENT_ACTIONS_EVENT,
  ASSORTMENT_CHECKLIST_STORAGE_KEY,
  type AssortmentAction,
  type AssortmentChecklistItem,
  type AssortmentChecklistItemStatus,
  type AssortmentExecutionPlan,
  type AssortmentPlanChecklistSection,
} from "./types";

const SCHEMA = "vokra.assortmentChecklist.v1" as const;

type ChecklistRoot = {
  schema: typeof SCHEMA;
  bySnapshot: Record<string, Record<string, AssortmentChecklistItem>>;
};

function parseRoot(): ChecklistRoot {
  const raw = lsGet(ASSORTMENT_CHECKLIST_STORAGE_KEY);
  if (!raw) return { schema: SCHEMA, bySnapshot: {} };
  try {
    const o = JSON.parse(raw) as ChecklistRoot;
    if (!o || typeof o !== "object" || !o.bySnapshot) return { schema: SCHEMA, bySnapshot: {} };
    return o;
  } catch {
    return { schema: SCHEMA, bySnapshot: {} };
  }
}

function saveRoot(r: ChecklistRoot) {
  try {
    lsSet(ASSORTMENT_CHECKLIST_STORAGE_KEY, JSON.stringify(r));
    window.dispatchEvent(new Event(ASSORTMENT_ACTIONS_EVENT));
  } catch {
    /* quota */
  }
}

export function getAssortmentChecklistMap(snapshotId: string): Record<string, AssortmentChecklistItem> {
  const r = parseRoot();
  return { ...(r.bySnapshot[snapshotId] ?? {}) };
}

function writeSnapshotMap(snapshotId: string, map: Record<string, AssortmentChecklistItem>) {
  const r = parseRoot();
  r.bySnapshot[snapshotId] = map;
  saveRoot(r);
}

/** True if this snapshot ever had checklist rows (sync or memory restore). */
export function snapshotHasAssortmentChecklist(snapshotId: string): boolean {
  const r = parseRoot();
  const m = r.bySnapshot[snapshotId];
  return !!m && Object.keys(m).length > 0;
}

type TFn = (key: string, vars?: Record<string, string>) => string;

function actionToFields(action: AssortmentAction, snapshotId: string, t: TFn) {
  return {
    title: t(action.titleKey, action.titleVars),
    reason: t(action.reasonKey, action.reasonVars),
    expectedOutcome: action.expectedOutcome,
    ownerHint: action.ownerSystem,
    sourceSnapshotId: snapshotId,
  };
}

/**
 * Align checklist rows with the current execution plan; preserve status by sourceActionId.
 * Marks rows as stale when their action is no longer in any plan bucket.
 */
export function syncAssortmentChecklistFromPlan(snapshotId: string, plan: AssortmentExecutionPlan, t: TFn): void {
  const before = getAssortmentChecklistMap(snapshotId);
  const map: Record<string, AssortmentChecklistItem> = { ...before };
  const now = Date.now();
  const inPlan = new Set<string>();

  const touch = (action: AssortmentAction, section: AssortmentPlanChecklistSection) => {
    inPlan.add(action.id);
    const fields = actionToFields(action, snapshotId, t);
    const prev = map[action.id];
    if (!prev) {
      map[action.id] = {
        id: action.id,
        sourceActionId: action.id,
        sourceSnapshotId: snapshotId,
        title: fields.title,
        section,
        status: "todo",
        reason: fields.reason,
        expectedOutcome: fields.expectedOutcome,
        ownerHint: fields.ownerHint,
        createdAt: now,
        updatedAt: now,
        stale: false,
      };
      return;
    }
    map[action.id] = {
      ...prev,
      ...fields,
      section,
      stale: false,
      updatedAt: now,
    };
  };

  for (const a of plan.todayActions) touch(a, "today");
  for (const a of plan.weekActions) touch(a, "week");
  for (const a of plan.laterActions) touch(a, "later");
  for (const a of plan.holdActions) touch(a, "hold");

  for (const id of Object.keys(map)) {
    const row = map[id];
    if (!row || row.sourceSnapshotId !== snapshotId) continue;
    if (!inPlan.has(id)) {
      map[id] = { ...row, stale: true, updatedAt: now };
    }
  }

  if (JSON.stringify(before) === JSON.stringify(map)) return;
  writeSnapshotMap(snapshotId, map);
}

/** Re-resolve titles/reasons from plan for existing rows (e.g. locale change). */
export function refreshAssortmentChecklistCopy(snapshotId: string, plan: AssortmentExecutionPlan, t: TFn): void {
  const before = getAssortmentChecklistMap(snapshotId);
  const map = { ...before };
  const now = Date.now();
  const touch = (action: AssortmentAction, section: AssortmentPlanChecklistSection) => {
    const prev = map[action.id];
    if (!prev) return;
    const fields = actionToFields(action, snapshotId, t);
    map[action.id] = { ...prev, ...fields, section, updatedAt: now };
  };
  for (const a of plan.todayActions) touch(a, "today");
  for (const a of plan.weekActions) touch(a, "week");
  for (const a of plan.laterActions) touch(a, "later");
  for (const a of plan.holdActions) touch(a, "hold");
  if (JSON.stringify(before) === JSON.stringify(map)) return;
  writeSnapshotMap(snapshotId, map);
}

export function setAssortmentChecklistStatus(snapshotId: string, sourceActionId: string, status: AssortmentChecklistItemStatus): void {
  const map = { ...getAssortmentChecklistMap(snapshotId) };
  const prev = map[sourceActionId];
  if (!prev) return;
  const now = Date.now();
  map[sourceActionId] = { ...prev, status, updatedAt: now };
  writeSnapshotMap(snapshotId, map);
}

export type AssortmentChecklistProgress = {
  doneToday: number;
  totalToday: number;
  doneWeek: number;
  totalWeek: number;
  blocked: number;
  staleCount: number;
};

export function getAssortmentChecklistProgress(snapshotId: string, plan: AssortmentExecutionPlan): AssortmentChecklistProgress {
  const map = getAssortmentChecklistMap(snapshotId);
  const todayIds = plan.todayActions.map((a) => a.id);
  const weekIds = plan.weekActions.map((a) => a.id);
  const doneToday = todayIds.filter((id) => map[id]?.status === "done").length;
  const doneWeek = weekIds.filter((id) => map[id]?.status === "done").length;
  let blocked = 0;
  let staleCount = 0;
  for (const row of Object.values(map)) {
    if (row.sourceSnapshotId !== snapshotId) continue;
    if (row.stale) staleCount += 1;
    if (row.status === "blocked") blocked += 1;
  }
  return {
    doneToday,
    totalToday: todayIds.length,
    doneWeek,
    totalWeek: weekIds.length,
    blocked,
    staleCount,
  };
}

export function exportAssortmentChecklistForMemory(snapshotId: string): AssortmentChecklistItem[] {
  return Object.values(getAssortmentChecklistMap(snapshotId));
}

/** Merge memory-exported checklist into localStorage for this snapshot. */
export function mergeAssortmentChecklistFromMemory(snapshotId: string, items: readonly AssortmentChecklistItem[]): void {
  if (!items.length) return;
  const map = { ...getAssortmentChecklistMap(snapshotId) };
  const now = Date.now();
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const id = typeof raw.sourceActionId === "string" ? raw.sourceActionId : typeof raw.id === "string" ? raw.id : "";
    if (!id) continue;
    const prev = map[id];
    const status = (raw.status as AssortmentChecklistItemStatus) ?? prev?.status ?? "todo";
    const section = (raw.section as AssortmentPlanChecklistSection) ?? prev?.section ?? "later";
    const merged: AssortmentChecklistItem = {
      id,
      sourceActionId: id,
      sourceSnapshotId: snapshotId,
      title: typeof raw.title === "string" ? raw.title : prev?.title ?? id,
      section,
      status,
      reason: typeof raw.reason === "string" ? raw.reason : prev?.reason ?? "",
      expectedOutcome: raw.expectedOutcome ?? prev?.expectedOutcome ?? "structural_clarity",
      ownerHint: typeof raw.ownerHint === "string" ? raw.ownerHint : prev?.ownerHint ?? "",
      createdAt: typeof raw.createdAt === "number" ? raw.createdAt : prev?.createdAt ?? now,
      updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
      stale: Boolean(raw.stale),
    };
    map[id] = merged;
  }
  writeSnapshotMap(snapshotId, map);
}
