import type { AssortmentChecklistItem, AssortmentExecutionPlan, AssortmentExecutionReview } from "./types";
import { getAssortmentChecklistMap } from "./checklist-storage";
import { clip } from "../math";

function byUpdatedDesc(a: AssortmentChecklistItem, b: AssortmentChecklistItem): number {
  return b.updatedAt - a.updatedAt;
}

type TFn = (key: string, vars?: Record<string, string>) => string;

/** Counts for Daily line when friction exists (blocked and/or carry-forward). */
export function getAssortmentReviewCarryDigestVars(
  snapshotId: string,
  _plan: AssortmentExecutionPlan,
  map: Record<string, AssortmentChecklistItem>,
): { blocked: number; carry: number } | null {
  const rows = Object.values(map).filter((r) => r.sourceSnapshotId === snapshotId);
  if (rows.length === 0) return null;
  let blocked = 0;
  let carry = 0;
  for (const r of rows) {
    if (r.status === "blocked") blocked += 1;
    if (r.status === "deferred" || r.stale) carry += 1;
  }
  if (blocked === 0 && carry === 0) return null;
  return { blocked, carry };
}

/** Founder-oriented review from checklist + current plan (no analytics APIs). */
export function buildAssortmentExecutionReview(
  snapshotId: string,
  plan: AssortmentExecutionPlan,
  map: Record<string, AssortmentChecklistItem>,
  _t: TFn,
): AssortmentExecutionReview | null {
  const rows = Object.values(map).filter((r) => r.sourceSnapshotId === snapshotId);
  if (rows.length === 0) return null;

  const doneItems = rows.filter((r) => r.status === "done").sort(byUpdatedDesc);
  const blockedItems = rows.filter((r) => r.status === "blocked").sort(byUpdatedDesc);
  const deferredItems = rows.filter((r) => r.status === "deferred").sort(byUpdatedDesc);
  const staleItems = rows.filter((r) => r.stale).sort(byUpdatedDesc);

  const inPlan = new Set<string>([
    ...plan.todayActions.map((a) => a.id),
    ...plan.weekActions.map((a) => a.id),
    ...plan.laterActions.map((a) => a.id),
    ...plan.holdActions.map((a) => a.id),
  ]);

  let doneInPlan = 0;
  for (const id of inPlan) {
    if (map[id]?.status === "done") doneInPlan += 1;
  }
  const completionRate = inPlan.size === 0 ? 0 : Math.min(100, Math.round((100 * doneInPlan) / inPlan.size));

  const topBlocked = blockedItems[0];
  let blockerSummaryKey: string;
  const blockerSummaryVars: Record<string, string> = {
    n: String(blockedItems.length),
    hint: topBlocked ? clip(topBlocked.title, 52) : "—",
    carry: String(deferredItems.length + staleItems.length),
  };

  if (blockedItems.length > 0) {
    blockerSummaryKey = "aa.review.blockerSummary.has";
  } else if (deferredItems.length > 0 || staleItems.length > 0) {
    blockerSummaryKey = "aa.review.blockerSummary.carry";
  } else {
    blockerSummaryKey = "aa.review.blockerSummary.clear";
  }

  const nextPlanSuggestions: string[] = [];
  if (blockedItems.length > 0) nextPlanSuggestions.push("aa.review.next.unblockFirst");
  if (staleItems.length > 0) nextPlanSuggestions.push("aa.review.next.reconcileStale");
  if (deferredItems.length > 0) nextPlanSuggestions.push("aa.review.next.slotDeferred");
  if (plan.holdActions.length >= 2) nextPlanSuggestions.push("aa.review.next.sequenceHold");
  if (nextPlanSuggestions.length === 0) nextPlanSuggestions.push("aa.review.next.keepCadence");

  const learningNotes: string[] = [];
  if (blockedItems.length >= 2) learningNotes.push("aa.review.learn.multipleBlocks");
  if (deferredItems.length >= 2 && deferredItems.length >= blockedItems.length) {
    learningNotes.push("aa.review.learn.deferPattern");
  }
  if (completionRate < 40 && inPlan.size >= 4) learningNotes.push("aa.review.learn.scopeDown");
  if (learningNotes.length === 0) learningNotes.push("aa.review.learn.steady");

  return {
    sourceSnapshotId: snapshotId,
    createdAt: Date.now(),
    doneItems,
    blockedItems,
    deferredItems,
    staleItems,
    completionRate,
    blockerSummaryKey,
    blockerSummaryVars,
    nextPlanSuggestions,
    learningNotes,
    nextSuggestedFocusKey: plan.estimatedFocus,
  };
}

/** Rebuild review from live storage (for digest line without full view mount). */
export function computeAssortmentReviewCarryDigest(
  snapshotId: string,
  plan: AssortmentExecutionPlan,
): { blocked: number; carry: number } | null {
  return getAssortmentReviewCarryDigestVars(snapshotId, plan, getAssortmentChecklistMap(snapshotId));
}
