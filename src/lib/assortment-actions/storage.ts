import { lsGet, lsSet } from "../storage";
import { ASSORTMENT_ACTION_STATUS_STORAGE_KEY, ASSORTMENT_ACTIONS_EVENT, type AssortmentActionStatus } from "./types";

const SCHEMA = "vokra.assortmentActions.statuses.v1" as const;

type StatusRoot = {
  schema: typeof SCHEMA;
  bySnapshot: Record<string, Record<string, AssortmentActionStatus>>;
};

function parseRoot(): StatusRoot {
  const raw = lsGet(ASSORTMENT_ACTION_STATUS_STORAGE_KEY);
  if (!raw) return { schema: SCHEMA, bySnapshot: {} };
  try {
    const o = JSON.parse(raw) as StatusRoot;
    if (!o || typeof o !== "object" || !o.bySnapshot) return { schema: SCHEMA, bySnapshot: {} };
    return o;
  } catch {
    return { schema: SCHEMA, bySnapshot: {} };
  }
}

function saveRoot(r: StatusRoot) {
  try {
    lsSet(ASSORTMENT_ACTION_STATUS_STORAGE_KEY, JSON.stringify(r));
    window.dispatchEvent(new Event(ASSORTMENT_ACTIONS_EVENT));
  } catch {
    /* quota */
  }
}

export function getAssortmentStatusMap(snapshotId: string): Record<string, AssortmentActionStatus> {
  const r = parseRoot();
  return { ...(r.bySnapshot[snapshotId] ?? {}) };
}

export function setAssortmentActionStatus(snapshotId: string, actionId: string, status: AssortmentActionStatus) {
  const r = parseRoot();
  const cur = { ...(r.bySnapshot[snapshotId] ?? {}) };
  cur[actionId] = status;
  r.bySnapshot[snapshotId] = cur;
  saveRoot(r);
}

export function mergeStatusesIntoActions<T extends { id: string; status: AssortmentActionStatus }>(
  actions: T[],
  snapshotId: string,
): T[] {
  const m = getAssortmentStatusMap(snapshotId);
  return actions.map((a) => ({ ...a, status: m[a.id] ?? a.status }));
}

export function bulkSetAssortmentStatuses(snapshotId: string, statuses: Record<string, AssortmentActionStatus>) {
  const r = parseRoot();
  r.bySnapshot[snapshotId] = { ...(r.bySnapshot[snapshotId] ?? {}), ...statuses };
  saveRoot(r);
}
