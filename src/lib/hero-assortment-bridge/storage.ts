import { lsGet, lsSet } from "../storage";
import { ASSORTMENT_ACTIONS_EVENT } from "../assortment-actions/types";
import { HERO_COMMAND_EVENT } from "../hero-command/digest";
import type { HeroExecutionAction, HeroExecutionActionStatus, HeroExecutionActionsRoot } from "./types";
import { HERO_EXECUTION_ACTIONS_STORAGE_KEY } from "./types";

function parseRoot(): HeroExecutionActionsRoot {
  const raw = lsGet(HERO_EXECUTION_ACTIONS_STORAGE_KEY);
  if (!raw) return { schema: HERO_EXECUTION_ACTIONS_STORAGE_KEY, bySnapshot: {} };
  try {
    const o = JSON.parse(raw) as HeroExecutionActionsRoot;
    if (!o?.bySnapshot) return { schema: HERO_EXECUTION_ACTIONS_STORAGE_KEY, bySnapshot: {} };
    return o;
  } catch {
    return { schema: HERO_EXECUTION_ACTIONS_STORAGE_KEY, bySnapshot: {} };
  }
}

function saveRoot(r: HeroExecutionActionsRoot) {
  try {
    lsSet(HERO_EXECUTION_ACTIONS_STORAGE_KEY, JSON.stringify(r));
    window.dispatchEvent(new Event(ASSORTMENT_ACTIONS_EVENT));
    window.dispatchEvent(new Event(HERO_COMMAND_EVENT));
  } catch {
    /* quota */
  }
}

export function getHeroExecutionActions(snapshotId: string): HeroExecutionAction[] {
  const r = parseRoot();
  return [...(r.bySnapshot[snapshotId] ?? [])];
}

export function listActiveHeroExecutionActions(snapshotId: string): HeroExecutionAction[] {
  return getHeroExecutionActions(snapshotId).filter((a) => a.status !== "done" && a.status !== "deferred");
}

export function upsertHeroExecutionAction(snapshotId: string, action: HeroExecutionAction): void {
  const r = parseRoot();
  const list = [...(r.bySnapshot[snapshotId] ?? [])];
  const i = list.findIndex((x) => x.id === action.id);
  if (i >= 0) list[i] = action;
  else list.push(action);
  r.bySnapshot[snapshotId] = list;
  saveRoot(r);
}

export function setHeroExecutionActionStatus(
  snapshotId: string,
  actionId: string,
  status: HeroExecutionActionStatus,
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

export function bulkMergeHeroExecutionActions(snapshotId: string, incoming: HeroExecutionAction[]): void {
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

export function exportHeroExecutionActionsForMemory(snapshotId: string): HeroExecutionAction[] {
  return getHeroExecutionActions(snapshotId);
}
