import { lsGet, lsSet } from "../storage";
import { ASSORTMENT_ACTIONS_EVENT } from "./types";

export const ASSORTMENT_PLAN_CONTINUITY_STORAGE_KEY = "vokra.assortmentPlanContinuity.v1" as const;

const SCHEMA = "vokra.assortmentPlanContinuity.v1" as const;

export type PlanContinuitySnapshot = {
  /** Completion rate (0–100) from the last plan build — used as “previous” on the next build. */
  previousCompletionRate: number | null;
  /** Checklist-blocked action ids recorded at last build (for “repeated blocker”). */
  previouslyBlockedActionIds: string[];
  updatedAt: number;
};

type ContinuityRoot = {
  schema: typeof SCHEMA;
  bySnapshot: Record<string, PlanContinuitySnapshot>;
};

function parseRoot(): ContinuityRoot {
  const raw = lsGet(ASSORTMENT_PLAN_CONTINUITY_STORAGE_KEY);
  if (!raw) return { schema: SCHEMA, bySnapshot: {} };
  try {
    const o = JSON.parse(raw) as ContinuityRoot;
    if (!o || typeof o !== "object" || !o.bySnapshot) return { schema: SCHEMA, bySnapshot: {} };
    return o;
  } catch {
    return { schema: SCHEMA, bySnapshot: {} };
  }
}

function saveRoot(r: ContinuityRoot) {
  try {
    lsSet(ASSORTMENT_PLAN_CONTINUITY_STORAGE_KEY, JSON.stringify(r));
    window.dispatchEvent(new Event(ASSORTMENT_ACTIONS_EVENT));
  } catch {
    /* quota */
  }
}

export function getPlanContinuitySnapshot(snapshotId: string): PlanContinuitySnapshot {
  const r = parseRoot();
  const cur = r.bySnapshot[snapshotId];
  return {
    previousCompletionRate: typeof cur?.previousCompletionRate === "number" ? cur.previousCompletionRate : null,
    previouslyBlockedActionIds: Array.isArray(cur?.previouslyBlockedActionIds) ? [...cur.previouslyBlockedActionIds] : [],
    updatedAt: typeof cur?.updatedAt === "number" ? cur.updatedAt : 0,
  };
}

/** Persist completion + blocked set for the next plan build (carry / repeated blocker). */
export function setPlanContinuitySnapshot(snapshotId: string, snap: PlanContinuitySnapshot): void {
  const r = parseRoot();
  r.bySnapshot[snapshotId] = { ...snap, updatedAt: Date.now() };
  saveRoot(r);
}

/** Update continuity without firing assortment event (avoid rebuild loops from plan useMemo). */
export function setPlanContinuitySnapshotQuiet(snapshotId: string, snap: PlanContinuitySnapshot): void {
  const r = parseRoot();
  const prev = r.bySnapshot[snapshotId];
  const nextBlocked = [...snap.previouslyBlockedActionIds].sort().join(",");
  const prevBlocked = [...(prev?.previouslyBlockedActionIds ?? [])].sort().join(",");
  if (prev?.previousCompletionRate === snap.previousCompletionRate && prevBlocked === nextBlocked) return;
  r.bySnapshot[snapshotId] = { ...snap, updatedAt: Date.now() };
  try {
    lsSet(ASSORTMENT_PLAN_CONTINUITY_STORAGE_KEY, JSON.stringify(r));
  } catch {
    /* quota */
  }
}
