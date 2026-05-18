import { lsGet, lsSet } from "../storage";
import { stableActionId } from "./hash";
import type {
  AssortmentAction,
  AssortmentActionType,
  AssortmentChecklistItem,
  AssortmentExecutionLearningSignal,
  AssortmentLearningSignalType,
} from "./types";
import { ASSORTMENT_EXECUTION_LEARNING_STORAGE_KEY } from "./types";

const SCHEMA = "vokra.assortmentExecutionLearning.v1" as const;

export type AssortmentLearningStoreSnapshot = {
  signals: AssortmentExecutionLearningSignal[];
  recurrenceByActionType: Record<string, number>;
  recurrenceByBlocker: Record<string, number>;
  completionTendencies: Record<string, { fastDone: number; done: number }>;
  lastUpdated: number;
};

type LearningRoot = {
  schema: typeof SCHEMA;
  bySnapshot: Record<string, AssortmentLearningStoreSnapshot>;
};

function parseRoot(): LearningRoot {
  const raw = lsGet(ASSORTMENT_EXECUTION_LEARNING_STORAGE_KEY);
  if (!raw) return { schema: SCHEMA, bySnapshot: {} };
  try {
    const o = JSON.parse(raw) as LearningRoot;
    if (!o || typeof o !== "object" || !o.bySnapshot) return { schema: SCHEMA, bySnapshot: {} };
    return o;
  } catch {
    return { schema: SCHEMA, bySnapshot: {} };
  }
}

function writeRootQuiet(r: LearningRoot) {
  try {
    lsSet(ASSORTMENT_EXECUTION_LEARNING_STORAGE_KEY, JSON.stringify(r));
  } catch {
    /* quota */
  }
}

function emptySnap(): AssortmentLearningStoreSnapshot {
  return {
    signals: [],
    recurrenceByActionType: {},
    recurrenceByBlocker: {},
    completionTendencies: {},
    lastUpdated: 0,
  };
}

export function getLearningSnapshot(snapshotId: string): AssortmentLearningStoreSnapshot {
  const r = parseRoot();
  const cur = r.bySnapshot[snapshotId];
  if (!cur) return emptySnap();
  return {
    signals: Array.isArray(cur.signals) ? [...cur.signals] : [],
    recurrenceByActionType: { ...(cur.recurrenceByActionType ?? {}) },
    recurrenceByBlocker: { ...(cur.recurrenceByBlocker ?? {}) },
    completionTendencies: { ...(cur.completionTendencies ?? {}) },
    lastUpdated: typeof cur.lastUpdated === "number" ? cur.lastUpdated : 0,
  };
}

function saveSnapshot(snapshotId: string, snap: AssortmentLearningStoreSnapshot) {
  const r = parseRoot();
  r.bySnapshot[snapshotId] = { ...snap, lastUpdated: Date.now() };
  writeRootQuiet(r);
}

function signalId(snapshotId: string, signalType: AssortmentLearningSignalType, actionType: string, extra?: string): string {
  return stableActionId(["learn", snapshotId, signalType, actionType, extra ?? ""]);
}

function bump(map: Record<string, number>, key: string, n = 1) {
  map[key] = (map[key] ?? 0) + n;
}

function bumpMap(m: Map<string, number>, k: string, v: number) {
  m.set(k, (m.get(k) ?? 0) + v);
}

function sameUtcDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function mergeLearningSignalsIntoStorage(snapshotId: string, incoming: readonly AssortmentExecutionLearningSignal[]): void {
  if (!incoming.length) return;
  const snap = getLearningSnapshot(snapshotId);
  const byId = new Map(snap.signals.map((s) => [s.id, { ...s }]));

  for (const inc of incoming) {
    const prev = byId.get(inc.id);
    let merged: AssortmentExecutionLearningSignal;
    if (prev) {
      if (sameUtcDay(prev.createdAt, inc.createdAt)) {
        merged = {
          ...prev,
          ...inc,
          recurrenceCount: Math.max(prev.recurrenceCount, inc.recurrenceCount),
          affectedActionIds: [...new Set([...prev.affectedActionIds, ...inc.affectedActionIds])],
          confidence: Math.max(prev.confidence, inc.confidence),
          createdAt: prev.createdAt,
        };
      } else {
        merged = {
          ...prev,
          recurrenceCount: prev.recurrenceCount + inc.recurrenceCount,
          affectedActionIds: [...new Set([...prev.affectedActionIds, ...inc.affectedActionIds])],
          confidence: Math.min(95, Math.round(prev.confidence + inc.recurrenceCount * 8)),
          createdAt: Math.min(prev.createdAt, inc.createdAt),
        };
      }
      byId.set(inc.id, merged);
    } else {
      merged = { ...inc };
      byId.set(inc.id, merged);
    }

    const oldRec = prev?.recurrenceCount ?? 0;
    const newRec = merged.recurrenceCount;
    const statsBump =
      prev && sameUtcDay(prev.createdAt, inc.createdAt) ? Math.max(0, newRec - oldRec) : prev ? inc.recurrenceCount : inc.recurrenceCount;

    bump(snap.recurrenceByActionType, inc.actionType, statsBump);
    if (inc.signalType === "repeated_blocker") bump(snap.recurrenceByBlocker, inc.actionType, statsBump);

    if (inc.signalType === "fast_completion" && statsBump > 0) {
      const cur = snap.completionTendencies[inc.actionType] ?? { fastDone: 0, done: 0 };
      cur.fastDone += statsBump;
      cur.done += statsBump;
      snap.completionTendencies[inc.actionType] = cur;
    }
  }

  snap.signals = [...byId.values()].sort((a, b) => b.recurrenceCount * b.confidence - a.recurrenceCount * a.confidence).slice(0, 40);
  saveSnapshot(snapshotId, snap);
}

export function getTopLearningSignals(snapshotId: string, limit: number): AssortmentExecutionLearningSignal[] {
  const snap = getLearningSnapshot(snapshotId);
  return [...snap.signals].sort((a, b) => b.recurrenceCount * b.confidence - a.recurrenceCount * a.confidence).slice(0, limit);
}

export function exportLearningSignalsForMemory(snapshotId: string, limit = 12): AssortmentExecutionLearningSignal[] {
  return getTopLearningSignals(snapshotId, limit);
}

export function mergeLearningSignalsFromMemory(snapshotId: string, items: readonly AssortmentExecutionLearningSignal[]): void {
  if (!items.length) return;
  mergeLearningSignalsIntoStorage(snapshotId, items);
}

export type CarrySlice = {
  repeatedBlockers: string[];
  carriedForwardActionIds: string[];
  blockedCarryCount: number;
  deferredCarryCount: number;
  staleCarryCount: number;
};

/** Heuristic signals from one plan cycle (no ML, no backend). */
export function deriveLearningSignalsFromCycle(
  snapshotId: string,
  eligible: readonly AssortmentAction[],
  checklist: Record<string, AssortmentChecklistItem>,
  carry: CarrySlice,
  today: readonly AssortmentAction[],
  week: readonly AssortmentAction[],
): AssortmentExecutionLearningSignal[] {
  const byId = new Map(eligible.map((a) => [a.id, a]));
  const now = Date.now();
  const out: AssortmentExecutionLearningSignal[] = [];

  const deferCount = new Map<string, number>();
  const staleCount = new Map<string, number>();
  const fastDone = new Map<string, number>();
  const blockedTypes = new Map<string, string[]>();

  for (const row of Object.values(checklist)) {
    if (row.sourceSnapshotId !== snapshotId) continue;
    const a = byId.get(row.sourceActionId);
    if (!a) continue;
    if (row.status === "deferred") bumpMap(deferCount, a.actionType, 1);
    if (row.stale) bumpMap(staleCount, a.actionType, 1);
    if (row.status === "done" && a.effortScore < 48) bumpMap(fastDone, a.actionType, 1);
    if (row.status === "blocked") {
      const arr = blockedTypes.get(a.actionType) ?? [];
      arr.push(row.sourceActionId);
      blockedTypes.set(a.actionType, arr);
    }
  }

  for (const id of carry.repeatedBlockers) {
    const a = byId.get(id);
    if (!a) continue;
    out.push({
      id: signalId(snapshotId, "repeated_blocker", a.actionType, id),
      sourceSnapshotId: snapshotId,
      actionType: a.actionType,
      signalType: "repeated_blocker",
      title: "aa.learn.title.repeated_blocker",
      reason: "aa.learn.reason.repeated_blocker",
      recurrenceCount: 2,
      affectedActionIds: [id],
      recommendedAdjustment: "aa.learn.adjust.hold_or_unblock",
      confidence: 72,
      createdAt: now,
      titleVars: { type: a.actionType },
      reasonVars: { type: a.actionType },
    });
  }

  for (const [actionType, n] of deferCount) {
    if (n < 2) continue;
    out.push({
      id: signalId(snapshotId, "repeated_deferral", actionType),
      sourceSnapshotId: snapshotId,
      actionType: actionType as AssortmentActionType,
      signalType: "repeated_deferral",
      title: "aa.learn.title.repeated_deferral",
      reason: "aa.learn.reason.repeated_deferral",
      recurrenceCount: n,
      affectedActionIds: [],
      recommendedAdjustment: "aa.learn.adjust.reduce_today_slice",
      confidence: Math.min(88, 50 + n * 8),
      createdAt: now,
      titleVars: { type: actionType },
      reasonVars: { type: actionType },
    });
  }

  for (const [actionType, n] of staleCount) {
    if (n < 2) continue;
    out.push({
      id: signalId(snapshotId, "stale_carry", actionType),
      sourceSnapshotId: snapshotId,
      actionType: actionType as AssortmentActionType,
      signalType: "stale_carry",
      title: "aa.learn.title.stale_carry",
      reason: "aa.learn.reason.stale_carry",
      recurrenceCount: n,
      affectedActionIds: [],
      recommendedAdjustment: "aa.learn.adjust.reconcile_import",
      confidence: Math.min(85, 48 + n * 10),
      createdAt: now,
      titleVars: { type: actionType },
      reasonVars: { type: actionType },
    });
  }

  for (const [actionType, n] of fastDone) {
    if (n < 2) continue;
    out.push({
      id: signalId(snapshotId, "fast_completion", actionType),
      sourceSnapshotId: snapshotId,
      actionType: actionType as AssortmentActionType,
      signalType: "fast_completion",
      title: "aa.learn.title.fast_completion",
      reason: "aa.learn.reason.fast_completion",
      recurrenceCount: n,
      affectedActionIds: [],
      recommendedAdjustment: "aa.learn.adjust.promote_quick_wins",
      confidence: Math.min(82, 45 + n * 12),
      createdAt: now,
      titleVars: { type: actionType },
      reasonVars: { type: actionType },
    });
  }

  if (carry.carriedForwardActionIds.length >= 5) {
    out.push({
      id: signalId(snapshotId, "overplanned_section", "mixed"),
      sourceSnapshotId: snapshotId,
      actionType: "fix_data",
      signalType: "overplanned_section",
      title: "aa.learn.title.overplanned_section",
      reason: "aa.learn.reason.overplanned_section",
      recurrenceCount: 1,
      affectedActionIds: [...carry.carriedForwardActionIds].slice(0, 12),
      recommendedAdjustment: "aa.learn.adjust.narrow_today",
      confidence: 68,
      createdAt: now,
    });
  }

  const lowConf = today.filter((a) => a.confidence < 42);
  if (lowConf.length >= 2) {
    const t = lowConf[0]!.actionType;
    if (lowConf.filter((a) => a.actionType === t).length >= 2) {
      out.push({
        id: signalId(snapshotId, "low_confidence_action", t),
        sourceSnapshotId: snapshotId,
        actionType: t,
        signalType: "low_confidence_action",
        title: "aa.learn.title.low_confidence",
        reason: "aa.learn.reason.low_confidence",
        recurrenceCount: lowConf.filter((a) => a.actionType === t).length,
        affectedActionIds: lowConf.filter((a) => a.actionType === t).map((a) => a.id),
        recommendedAdjustment: "aa.learn.adjust.verify_data",
        confidence: 58,
        createdAt: now,
        titleVars: { type: t },
        reasonVars: { type: t },
      });
    }
  }

  const cleanupWeek = week.filter((a) => a.executiveQueues.includes("requires_cleanup")).length;
  if (cleanupWeek >= 3 && carry.deferredCarryCount >= 1) {
    out.push({
      id: signalId(snapshotId, "cleanup_bottleneck", "cleanup"),
      sourceSnapshotId: snapshotId,
      actionType: "fix_data",
      signalType: "cleanup_bottleneck",
      title: "aa.learn.title.cleanup_bottleneck",
      reason: "aa.learn.reason.cleanup_bottleneck",
      recurrenceCount: cleanupWeek,
      affectedActionIds: week.filter((a) => a.executiveQueues.includes("requires_cleanup")).map((a) => a.id).slice(0, 10),
      recommendedAdjustment: "aa.learn.adjust.cleanup_first",
      confidence: 74,
      createdAt: now,
    });
  }

  const heavyToday = today.filter((a) => a.effortScore >= 70);
  if (heavyToday.length >= 2) {
    const t = heavyToday[0]!.actionType;
    out.push({
      id: signalId(snapshotId, "high_effort_drag", t),
      sourceSnapshotId: snapshotId,
      actionType: t,
      signalType: "high_effort_drag",
      title: "aa.learn.title.high_effort_drag",
      reason: "aa.learn.reason.high_effort_drag",
      recurrenceCount: heavyToday.filter((a) => a.actionType === t).length,
      affectedActionIds: heavyToday.map((a) => a.id),
      recommendedAdjustment: "aa.learn.adjust.split_heavy",
      confidence: 66,
      createdAt: now,
      titleVars: { type: t },
      reasonVars: { type: t },
    });
  }

  for (const [actionType, ids] of blockedTypes) {
    if (ids.length >= 2) {
      out.push({
        id: signalId(snapshotId, "repeated_blocker", actionType, "type"),
        sourceSnapshotId: snapshotId,
        actionType: actionType as AssortmentActionType,
        signalType: "repeated_blocker",
        title: "aa.learn.title.blocked_cluster",
        reason: "aa.learn.reason.blocked_cluster",
        recurrenceCount: ids.length,
        affectedActionIds: ids.slice(0, 8),
        recommendedAdjustment: "aa.learn.adjust.hold_or_unblock",
        confidence: 70,
        createdAt: now,
        titleVars: { type: actionType },
        reasonVars: { type: actionType, n: String(ids.length) },
      });
    }
  }

  const dedup = new Map<string, AssortmentExecutionLearningSignal>();
  for (const s of out) {
    const prev = dedup.get(s.id);
    if (!prev || prev.recurrenceCount < s.recurrenceCount) dedup.set(s.id, s);
  }
  return [...dedup.values()];
}

/** Small explainable nudges from prior cycles (does not replace carry rules). */
export function applyLearningBiasToPlan(
  snapshotId: string,
  eligible: readonly AssortmentAction[],
  _checklist: Record<string, AssortmentChecklistItem>,
  today: AssortmentAction[],
  week: AssortmentAction[],
  _later: AssortmentAction[],
  hold: AssortmentAction[],
  carry: CarrySlice,
): void {
  const top = getTopLearningSignals(snapshotId, 4);
  let moves = 0;
  const byId = new Map(eligible.map((a) => [a.id, a]));

  const pull = (arr: AssortmentAction[], id: string): AssortmentAction | undefined => {
    const i = arr.findIndex((x) => x.id === id);
    if (i < 0) return undefined;
    const [x] = arr.splice(i, 1);
    return x;
  };

  for (const s of top) {
    if (moves >= 2) break;
    if (s.recurrenceCount < 2) continue;

    if (s.signalType === "high_effort_drag") {
      const cand = [...today].filter((a) => a.actionType === s.actionType).sort((a, b) => b.effortScore - a.effortScore)[0];
      if (cand && today.some((x) => x.id === cand.id)) {
        const x = pull(today, cand.id);
        if (x && !week.some((w) => w.id === x.id)) {
          week.unshift(x);
          moves += 1;
        }
      }
    }

    if (s.signalType === "repeated_blocker" && carry.repeatedBlockers.length > 0 && s.recurrenceCount >= 2) {
      const id = carry.repeatedBlockers.find((rid) => today.some((t) => t.id === rid));
      if (id) {
        const a = byId.get(id);
        const x = pull(today, id);
        if (x && a && !hold.some((h) => h.id === id)) {
          hold.unshift(x);
          moves += 1;
        }
      }
    }

    if (s.signalType === "fast_completion") {
      const pick = week.find((a) => a.actionType === s.actionType && a.effortScore < 52);
      if (pick && today.length < 8) {
        const x = pull(week, pick.id);
        if (x) {
          today.unshift(x);
          moves += 1;
        }
      }
    }

    if (s.signalType === "overplanned_section" && today.length > 6) {
      const x = today.pop();
      if (x && !week.some((w) => w.id === x.id)) {
        week.unshift(x);
        moves += 1;
      }
    }
  }
}

/** Persist heuristics after checklist/plan state settles (not on every passive plan read). */
export function commitAssortmentExecutionLearning(
  snapshotId: string,
  eligible: readonly AssortmentAction[],
  plan: {
    todayActions: readonly AssortmentAction[];
    weekActions: readonly AssortmentAction[];
    repeatedBlockers: readonly string[];
    carriedForwardActionIds: readonly string[];
  },
  checklist: Record<string, AssortmentChecklistItem>,
): void {
  const carry: CarrySlice = {
    repeatedBlockers: [...plan.repeatedBlockers],
    carriedForwardActionIds: [...plan.carriedForwardActionIds],
    blockedCarryCount: Object.values(checklist).filter((r) => r.sourceSnapshotId === snapshotId && r.status === "blocked").length,
    deferredCarryCount: Object.values(checklist).filter((r) => r.sourceSnapshotId === snapshotId && r.status === "deferred").length,
    staleCarryCount: Object.values(checklist).filter((r) => r.sourceSnapshotId === snapshotId && Boolean(r.stale)).length,
  };
  const incoming = deriveLearningSignalsFromCycle(snapshotId, eligible, checklist, carry, plan.todayActions, plan.weekActions);
  mergeLearningSignalsIntoStorage(snapshotId, incoming);
}
