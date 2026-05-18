import { stableActionId } from "./hash";
import { getAssortmentChecklistMap } from "./checklist-storage";
import { applyLearningBiasToPlan } from "./execution-learning";
import { getPlanContinuitySnapshot, setPlanContinuitySnapshotQuiet } from "./plan-continuity";
import type { AssortmentAction, AssortmentActionType, AssortmentChecklistItem, AssortmentExecutionPlan } from "./types";

function isPlanningEligible(a: AssortmentAction): boolean {
  return a.status !== "done" && a.status !== "rejected";
}

function isHold(a: AssortmentAction): boolean {
  if (a.marketTimingHold) return true;
  if (a.corridorStrategyHold) return true;
  if (a.fboFbsDecisionHold) return true;
  if (a.scalingSafetyHold) return true;
  if (a.productionPressureHold) return true;
  if (a.guardrailHold) return true;
  if (a.executiveQueues.includes("risky_expansion")) return true;
  if (a.operationalRisk >= 68) return true;
  if (a.actionType === "split_marketplace_group") return true;
  const mp = (a.marketplace ?? "").toLowerCase();
  if ((!mp || mp === "unknown" || mp === "—") && a.operationalRisk >= 52) return true;
  if (a.actionType === "launch_wave" && a.operationalRisk >= 60) return true;
  return false;
}

/** Blocked checklist row: send back to hold when structural risk is high. */
function blockedBelongsInHold(a: AssortmentAction): boolean {
  return isHold(a) || a.operationalRisk >= 58 || a.executiveQueues.includes("risky_expansion");
}

function isTodayShape(a: AssortmentAction): boolean {
  if (isHold(a)) return false;
  if (
    (a.actionType === "hero_workflow_step" ||
      a.actionType === "collection_workflow_step" ||
      a.actionType === "launch_workflow_step") &&
    a.status !== "done" &&
    a.status !== "rejected"
  ) {
    return true;
  }
  return a.leverageScore >= 54 && a.effortScore <= 60 && a.operationalRisk <= 52;
}

function isWeekCandidate(a: AssortmentAction): boolean {
  if (isHold(a)) return false;
  return (
    a.leverageScore >= 44 ||
    a.executiveQueues.includes("requires_cleanup") ||
    a.executiveQueues.includes("high_leverage") ||
    a.urgencyBand === "elevated" ||
    a.urgencyBand === "critical"
  );
}

function sortPlan(a: AssortmentAction, b: AssortmentAction): number {
  return b.executionPressure - a.executionPressure || b.leverageScore - a.leverageScore || b.confidence - a.confidence;
}

function dominantFocusKey(today: AssortmentAction[]): string {
  if (today.length === 0) return "aa.plan.focus.review";
  const counts = new Map<AssortmentActionType, number>();
  for (const a of today) {
    counts.set(a.actionType, (counts.get(a.actionType) ?? 0) + 1);
  }
  let top = today[0]!.actionType;
  let n = 0;
  for (const [k, v] of counts) {
    if (v > n) {
      n = v;
      top = k;
    }
  }
  if (top === "improve_seo" || top === "assign_corridor" || top === "fix_data") return "aa.plan.focus.dataHygiene";
  if (top === "prepare_fbo") return "aa.plan.focus.operations";
  if (top === "launch_wave" || top === "create_collection" || top === "promote_hero_candidate") return "aa.plan.focus.growth";
  if (top === "refresh_visual" || top === "hero_workflow_step") return "aa.plan.focus.visual";
  if (top === "collection_workflow_step") return "aa.plan.focus.growth";
  return "aa.plan.focus.mixed";
}

function bottleneckKey(plan: Pick<AssortmentExecutionPlan, "holdActions" | "weekActions" | "todayActions">): string {
  if (plan.holdActions.length >= 2) return "aa.plan.bottleneck.holdRisk";
  const cleanupWeek = plan.weekActions.filter((a) => a.executiveQueues.includes("requires_cleanup")).length;
  if (cleanupWeek >= 3) return "aa.plan.bottleneck.cleanup";
  if (plan.todayActions.length === 0 && plan.weekActions.length + plan.holdActions.length > 0) {
    return "aa.plan.bottleneck.noSafeToday";
  }
  return "aa.plan.bottleneck.none";
}

function collectWarnings(today: AssortmentAction[], week: AssortmentAction[], later: AssortmentAction[], hold: AssortmentAction[]): string[] {
  const w: string[] = [];
  if (hold.length > 0) w.push("aa.plan.warn.hold");
  if (today.length === 0 && week.length > 0) w.push("aa.plan.warn.deferToday");
  if (later.length >= today.length + week.length && later.length >= 6) {
    w.push("aa.plan.warn.largeLater");
  }
  return w;
}

function removeIdFromPlan(
  id: string,
  today: AssortmentAction[],
  week: AssortmentAction[],
  later: AssortmentAction[],
  hold: AssortmentAction[],
): void {
  const filt = (arr: AssortmentAction[]) => {
    const i = arr.findIndex((x) => x.id === id);
    if (i >= 0) arr.splice(i, 1);
  };
  filt(today);
  filt(week);
  filt(later);
  filt(hold);
}

function hasId(arr: readonly AssortmentAction[], id: string): boolean {
  return arr.some((x) => x.id === id);
}

function planCompletionRate(
  today: AssortmentAction[],
  week: AssortmentAction[],
  later: AssortmentAction[],
  hold: AssortmentAction[],
  checklist: Record<string, AssortmentChecklistItem>,
  snapshotId: string,
): number {
  const all = [...today, ...week, ...later, ...hold];
  if (all.length === 0) return 0;
  let done = 0;
  for (const a of all) {
    const r = checklist[a.id];
    if (r?.sourceSnapshotId === snapshotId && r.status === "done") done += 1;
  }
  return Math.round((100 * done) / all.length);
}

function applyCarryForward(
  snapshotId: string,
  eligible: AssortmentAction[],
  today: AssortmentAction[],
  week: AssortmentAction[],
  later: AssortmentAction[],
  hold: AssortmentAction[],
  checklist: Record<string, AssortmentChecklistItem>,
  previouslyBlockedIds: readonly string[],
): {
  carriedForwardActionIds: string[];
  repeatedBlockers: string[];
  continuityWarnings: string[];
  carryStrategy: string;
  blockedCarryCount: number;
  deferredCarryCount: number;
  staleCarryCount: number;
} {
  const actionById = new Map(eligible.map((a) => [a.id, a]));
  const carried = new Set<string>();
  let blockedCarryCount = 0;
  let deferredCarryCount = 0;
  let staleCarryCount = 0;

  const blockedNow = Object.values(checklist).filter(
    (r) => r.sourceSnapshotId === snapshotId && r.status === "blocked" && actionById.has(r.sourceActionId),
  );
  const repeatedBlockers = blockedNow.map((r) => r.sourceActionId).filter((id) => previouslyBlockedIds.includes(id));

  for (const row of blockedNow) {
    const a = actionById.get(row.sourceActionId);
    if (!a) continue;
    removeIdFromPlan(a.id, today, week, later, hold);
    carried.add(a.id);
    blockedCarryCount += 1;
    if (blockedBelongsInHold(a)) {
      if (!hasId(hold, a.id)) hold.unshift(a);
    } else {
      if (!hasId(today, a.id)) today.unshift(a);
      if (today.length > 10) today.splice(10);
    }
  }

  for (const row of Object.values(checklist)) {
    if (row.sourceSnapshotId !== snapshotId || row.status !== "deferred") continue;
    if (!actionById.has(row.sourceActionId)) continue;
    const a = actionById.get(row.sourceActionId)!;
    if (isHold(a)) {
      removeIdFromPlan(a.id, today, week, later, hold);
      carried.add(a.id);
      deferredCarryCount += 1;
      if (!hasId(hold, a.id)) hold.unshift(a);
      continue;
    }
    removeIdFromPlan(a.id, today, week, later, hold);
    carried.add(a.id);
    deferredCarryCount += 1;
    if (!hasId(week, a.id)) week.unshift(a);
    if (week.length > 14) week.splice(14);
  }

  for (const row of Object.values(checklist)) {
    if (row.sourceSnapshotId !== snapshotId || !row.stale) continue;
    if (!actionById.has(row.sourceActionId)) continue;
    const a = actionById.get(row.sourceActionId)!;
    if (row.status === "blocked" || row.status === "deferred") continue;
    removeIdFromPlan(a.id, today, week, later, hold);
    carried.add(a.id);
    staleCarryCount += 1;
    if (blockedBelongsInHold(a) || isHold(a)) {
      if (!hasId(hold, a.id)) hold.unshift(a);
    } else {
      if (!hasId(later, a.id)) later.unshift(a);
    }
  }

  for (const row of Object.values(checklist)) {
    if (row.sourceSnapshotId !== snapshotId || row.status !== "done") continue;
    if (!actionById.has(row.sourceActionId)) continue;
    const a = actionById.get(row.sourceActionId)!;
    removeIdFromPlan(a.id, today, week, later, hold);
    if (!hasId(later, a.id) && !hasId(week, a.id) && !hasId(today, a.id) && !hasId(hold, a.id)) {
      later.push(a);
    }
  }

  const continuityWarnings: string[] = [];
  if (repeatedBlockers.length > 0) continuityWarnings.push("aa.carry.warn.repeatedBlocker");
  if (carried.size > 6) continuityWarnings.push("aa.carry.warn.largeCarry");

  let carryStrategy = "aa.carry.strategy.steady";
  if (repeatedBlockers.length > 0) carryStrategy = "aa.carry.strategy.repeatToday";
  else if (staleCarryCount >= 3) carryStrategy = "aa.carry.strategy.holdUntilCleanup";
  else if (deferredCarryCount >= 2) carryStrategy = "aa.carry.strategy.moveToWeek";
  else if (staleCarryCount > 0 && eligible.some((e) => e.executiveQueues.includes("archive_candidates")))
    carryStrategy = "aa.carry.strategy.archiveConcern";
  else if (carried.size > 0) carryStrategy = "aa.carry.strategy.pushForward";

  function bubbleFront(arr: AssortmentAction[], id: string) {
    const i = arr.findIndex((x) => x.id === id);
    if (i > 0) {
      const [row] = arr.splice(i, 1);
      arr.unshift(row);
    }
  }
  for (const id of repeatedBlockers) {
    if (hasId(today, id)) bubbleFront(today, id);
    else if (hasId(hold, id)) bubbleFront(hold, id);
  }

  return {
    carriedForwardActionIds: [...carried],
    repeatedBlockers,
    continuityWarnings,
    carryStrategy,
    blockedCarryCount,
    deferredCarryCount,
    staleCarryCount,
  };
}

/** Founder-oriented execution buckets + lightweight carry-forward from checklist (no calendar / backend). */
export function buildAssortmentExecutionPlan(sourceSnapshotId: string, actions: readonly AssortmentAction[]): AssortmentExecutionPlan {
  const continuity = getPlanContinuitySnapshot(sourceSnapshotId);
  const checklist = getAssortmentChecklistMap(sourceSnapshotId);

  const eligible = actions.filter(isPlanningEligible);
  let hold = eligible.filter(isHold).sort(sortPlan);
  const holdIds = new Set(hold.map((h) => h.id));

  const rest1 = eligible.filter((a) => !holdIds.has(a.id));
  let today = rest1.filter(isTodayShape).sort(sortPlan).slice(0, 8);
  if (today.length === 0 && rest1.length > 0) {
    today = [...rest1]
      .sort(sortPlan)
      .filter((a) => a.operationalRisk <= 60)
      .slice(0, 3);
  }
  const todayIds = new Set(today.map((t) => t.id));

  const rest2 = rest1.filter((a) => !todayIds.has(a.id));
  let week = rest2.filter(isWeekCandidate).sort(sortPlan).slice(0, 14);
  const weekIds = new Set(week.map((w) => w.id));

  let later = rest2.filter((a) => !weekIds.has(a.id)).sort((a, b) => {
    const la = a.leverageScore + a.confidence * 0.2;
    const lb = b.leverageScore + b.confidence * 0.2;
    return la - lb;
  });

  const carry = applyCarryForward(
    sourceSnapshotId,
    eligible,
    today,
    week,
    later,
    hold,
    checklist,
    continuity.previouslyBlockedActionIds,
  );

  today.sort(sortPlan);
  week.sort(sortPlan);
  later.sort(sortPlan);
  hold.sort(sortPlan);

  const carrySlice = {
    repeatedBlockers: carry.repeatedBlockers,
    carriedForwardActionIds: carry.carriedForwardActionIds,
    blockedCarryCount: carry.blockedCarryCount,
    deferredCarryCount: carry.deferredCarryCount,
    staleCarryCount: carry.staleCarryCount,
  };
  applyLearningBiasToPlan(sourceSnapshotId, eligible, checklist, today, week, later, hold, carrySlice);
  today.sort(sortPlan);
  week.sort(sortPlan);
  later.sort(sortPlan);
  hold.sort(sortPlan);

  const completionNow = planCompletionRate(today, week, later, hold, checklist, sourceSnapshotId);
  if (continuity.previousCompletionRate !== null && completionNow < continuity.previousCompletionRate - 12) {
    carry.continuityWarnings.push("aa.carry.warn.slippage");
  }

  const blockedIdsForNext = Object.values(checklist)
    .filter((r) => r.sourceSnapshotId === sourceSnapshotId && r.status === "blocked" && eligible.some((e) => e.id === r.sourceActionId))
    .map((r) => r.sourceActionId);

  setPlanContinuitySnapshotQuiet(sourceSnapshotId, {
    previousCompletionRate: completionNow,
    previouslyBlockedActionIds: blockedIdsForNext,
    updatedAt: Date.now(),
  });

  const planSlice = { holdActions: hold, weekActions: week, todayActions: today };
  const estimatedFocus = dominantFocusKey(today);
  const bottleneck = bottleneckKey(planSlice);
  const warnings = collectWarnings(today, week, later, hold);
  const continuityWarnings = [...carry.continuityWarnings];

  const id = stableActionId([
    "execplan",
    sourceSnapshotId,
    String(today.length),
    String(week.length),
    String(hold.length),
    String(carry.carriedForwardActionIds.length),
  ]);

  return {
    id,
    sourceSnapshotId,
    createdAt: Date.now(),
    todayActions: today,
    weekActions: week,
    laterActions: later,
    holdActions: hold,
    estimatedFocus,
    bottleneck,
    expectedOutcome: "aa.plan.outcome.importDriven",
    warnings,
    carriedForwardActionIds: carry.carriedForwardActionIds,
    repeatedBlockers: carry.repeatedBlockers,
    previousCompletionRate: continuity.previousCompletionRate,
    continuityWarnings,
    carryStrategy: carry.carryStrategy,
  };
}
