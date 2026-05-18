import { lsGet, lsSet } from "../storage";
import { ASSORTMENT_ACTIONS_EVENT } from "../assortment-actions/types";
import type { CollectionExecutionAction, CollectionExecutionActionStatus, CollectionExecutionActionsRoot } from "./types";
import { COLLECTION_EXECUTION_ACTIONS_STORAGE_KEY } from "./types";

function parseRoot(): CollectionExecutionActionsRoot {
  const raw = lsGet(COLLECTION_EXECUTION_ACTIONS_STORAGE_KEY);
  if (!raw) return { schema: COLLECTION_EXECUTION_ACTIONS_STORAGE_KEY, bySnapshot: {} };
  try {
    const o = JSON.parse(raw) as CollectionExecutionActionsRoot;
    if (!o?.bySnapshot) return { schema: COLLECTION_EXECUTION_ACTIONS_STORAGE_KEY, bySnapshot: {} };
    return o;
  } catch {
    return { schema: COLLECTION_EXECUTION_ACTIONS_STORAGE_KEY, bySnapshot: {} };
  }
}

function saveRoot(r: CollectionExecutionActionsRoot) {
  try {
    lsSet(COLLECTION_EXECUTION_ACTIONS_STORAGE_KEY, JSON.stringify(r));
    window.dispatchEvent(new Event(ASSORTMENT_ACTIONS_EVENT));
  } catch {
    /* quota */
  }
}

export function getCollectionExecutionActions(snapshotId: string): CollectionExecutionAction[] {
  return [...(parseRoot().bySnapshot[snapshotId] ?? [])];
}

export function listActiveCollectionExecutionActions(snapshotId: string): CollectionExecutionAction[] {
  return getCollectionExecutionActions(snapshotId).filter((a) => a.status !== "done" && a.status !== "deferred");
}

export function upsertCollectionExecutionAction(snapshotId: string, action: CollectionExecutionAction): void {
  const r = parseRoot();
  const list = [...(r.bySnapshot[snapshotId] ?? [])];
  const i = list.findIndex((x) => x.id === action.id);
  if (i >= 0) list[i] = action;
  else list.push(action);
  r.bySnapshot[snapshotId] = list;
  saveRoot(r);
}

export function setCollectionExecutionActionStatus(
  snapshotId: string,
  actionId: string,
  status: CollectionExecutionActionStatus,
): void {
  const r = parseRoot();
  const list = r.bySnapshot[snapshotId];
  if (!list) return;
  const row = list.find((x) => x.id === actionId);
  if (!row) return;
  row.status = status;
  row.updatedAt = Date.now();
  saveRoot(r);
}

export function bulkMergeCollectionExecutionActions(
  snapshotId: string,
  incoming: CollectionExecutionAction[],
): void {
  if (!incoming.length) return;
  const r = parseRoot();
  const cur = [...(r.bySnapshot[snapshotId] ?? [])];
  const byId = new Map(cur.map((x) => [x.id, x]));
  for (const a of incoming) {
    const prev = byId.get(a.id);
    byId.set(a.id, prev ? { ...a, status: prev.status, updatedAt: Date.now() } : a);
  }
  r.bySnapshot[snapshotId] = [...byId.values()];
  saveRoot(r);
}

export function exportCollectionExecutionActionsForMemory(snapshotId: string): CollectionExecutionAction[] {
  return getCollectionExecutionActions(snapshotId);
}
