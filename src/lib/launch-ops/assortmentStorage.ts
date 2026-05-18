import { lsGet, lsSet } from "../storage";
import { ASSORTMENT_ACTIONS_EVENT } from "../assortment-actions/types";
import type { LaunchExecutionAction, LaunchExecutionActionStatus } from "./types";
import { LAUNCH_EXECUTION_ACTIONS_STORAGE_KEY } from "./types";

type Root = {
  schema: typeof LAUNCH_EXECUTION_ACTIONS_STORAGE_KEY;
  bySnapshot: Record<string, LaunchExecutionAction[]>;
};

function parseRoot(): Root {
  const raw = lsGet(LAUNCH_EXECUTION_ACTIONS_STORAGE_KEY);
  if (!raw) return { schema: LAUNCH_EXECUTION_ACTIONS_STORAGE_KEY, bySnapshot: {} };
  try {
    const o = JSON.parse(raw) as Root;
    return o?.bySnapshot ? o : { schema: LAUNCH_EXECUTION_ACTIONS_STORAGE_KEY, bySnapshot: {} };
  } catch {
    return { schema: LAUNCH_EXECUTION_ACTIONS_STORAGE_KEY, bySnapshot: {} };
  }
}

function saveRoot(r: Root) {
  try {
    lsSet(LAUNCH_EXECUTION_ACTIONS_STORAGE_KEY, JSON.stringify(r));
    window.dispatchEvent(new Event(ASSORTMENT_ACTIONS_EVENT));
  } catch {
    /* quota */
  }
}

export function getLaunchExecutionActions(snapshotId: string): LaunchExecutionAction[] {
  return [...(parseRoot().bySnapshot[snapshotId] ?? [])];
}

export function listActiveLaunchExecutionActions(snapshotId: string): LaunchExecutionAction[] {
  return getLaunchExecutionActions(snapshotId).filter((a) => a.status !== "done" && a.status !== "deferred");
}

export function setLaunchExecutionActionStatus(
  snapshotId: string,
  actionId: string,
  status: LaunchExecutionActionStatus,
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

export function bulkMergeLaunchExecutionActions(snapshotId: string, incoming: LaunchExecutionAction[]): void {
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

export function exportLaunchExecutionActionsForMemory(snapshotId: string): LaunchExecutionAction[] {
  return [...(parseRoot().bySnapshot[snapshotId] ?? [])];
}
