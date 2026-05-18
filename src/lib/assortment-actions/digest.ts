import { deriveSnapshotIntelligence, getActiveEntitySnapshot } from "../entity-snapshot";
import { buildAssortmentExecutionPlan } from "./execution-plan";
import { deriveAssortmentActions, summarizeAssortmentActions } from "./derive";
import { getCorridorPrioritySignalsFromIntel } from "./prioritization";
import { mergeStatusesIntoActions } from "./storage";
import { getAssortmentChecklistMap, getAssortmentChecklistProgress, snapshotHasAssortmentChecklist } from "./checklist-storage";
import { computeAssortmentReviewCarryDigest, buildAssortmentExecutionReview } from "./execution-review";
import { getTopLearningSignals } from "./execution-learning";
import { clip } from "../math";

type TFn = (key: string, vars?: Record<string, string>) => string;

export type AssortmentDailyDigest = {
  lineKey: string;
  vars: Record<string, string>;
  newCount: number;
  criticalNew: number;
  quickWinNew: number;
};

export function getAssortmentDailyDigest(t: TFn): AssortmentDailyDigest | null {
  const s = getActiveEntitySnapshot();
  if (!s) return null;
  const merged = mergeStatusesIntoActions(deriveAssortmentActions(s), s.id);
  const summary = summarizeAssortmentActions(merged);
  const base = {
    newCount: summary.newCount,
    criticalNew: summary.criticalNew,
    quickWinNew: summary.quickWinNew,
  };

  const actionable = merged.filter((a) => a.status !== "done" && a.status !== "rejected").length;
  if (actionable === 0) {
    return {
      lineKey: "daily.assortment.execDone",
      vars: {},
      ...base,
    };
  }

  const plan = buildAssortmentExecutionPlan(s.id, merged);
  const top0 = plan.todayActions[0];
  const todayTxt = top0 ? clip(t(top0.titleKey, top0.titleVars), 56) : t("aa.plan.digest.noToday");
  const holdTxt =
    plan.holdActions.length > 0
      ? clip(t(plan.holdActions[0]!.titleKey, plan.holdActions[0]!.titleVars), 40) +
        (plan.holdActions.length > 1 ? ` +${plan.holdActions.length - 1}` : "")
      : "";

  const holdSuffix = holdTxt ? t("aa.plan.digest.holdSuffix", { hint: holdTxt }) : "";

  return {
    lineKey: "daily.assortment.execLine",
    vars: {
      today: todayTxt,
      week: String(plan.weekActions.length),
      hold: holdSuffix,
    },
    ...base,
  };
}

/** One-line checklist accountability for Daily Operating Console (only when checklist exists for snapshot). */
export function getAssortmentChecklistDigestLine(t: TFn): string | null {
  const s = getActiveEntitySnapshot();
  if (!s || !snapshotHasAssortmentChecklist(s.id)) return null;
  const merged = mergeStatusesIntoActions(deriveAssortmentActions(s), s.id);
  if (merged.length === 0) return null;
  const plan = buildAssortmentExecutionPlan(s.id, merged);
  const p = getAssortmentChecklistProgress(s.id, plan);
  return t("daily.assortment.checklistLine", {
    doneToday: String(p.doneToday),
    totalToday: String(p.totalToday),
    blocked: String(p.blocked),
  });
}

/** Compact carry-forward line when blocked or deferred/stale friction exists. */
export function getAssortmentReviewCarryDigestLine(t: TFn): string | null {
  const s = getActiveEntitySnapshot();
  if (!s || !snapshotHasAssortmentChecklist(s.id)) return null;
  const merged = mergeStatusesIntoActions(deriveAssortmentActions(s), s.id);
  if (merged.length === 0) return null;
  const plan = buildAssortmentExecutionPlan(s.id, merged);
  const v = computeAssortmentReviewCarryDigest(s.id, plan);
  if (!v) return null;
  return t("daily.assortment.reviewCarryLine", { blocked: String(v.blocked), carry: String(v.carry) });
}

/** Repeated checklist blocker — one compact line for Daily. */
export function getAssortmentRepeatedBlockerDigestLine(t: TFn): string | null {
  const s = getActiveEntitySnapshot();
  if (!s) return null;
  const merged = mergeStatusesIntoActions(deriveAssortmentActions(s), s.id);
  if (merged.length === 0) return null;
  const plan = buildAssortmentExecutionPlan(s.id, merged);
  const rb = plan.repeatedBlockers;
  if (!rb.length) return null;
  const first = rb[0]!;
  const map = getAssortmentChecklistMap(s.id);
  const hint = clip(map[first]?.title ?? first.slice(-10), 44);
  return t("daily.assortment.repeatedBlocker", { hint });
}

/** Top stored learning signal — compact line for Daily Operating. */
export function getAssortmentLearningDigestLine(t: TFn): string | null {
  const s = getActiveEntitySnapshot();
  if (!s) return null;
  const top = getTopLearningSignals(s.id, 1);
  if (!top.length) return null;
  const sig = top[0]!;
  const typeLabel = t(`aa.type.${sig.actionType}`);
  const title = t(sig.title, {
    ...(sig.titleVars ?? {}),
    type: typeLabel,
    n: sig.reasonVars?.n ?? "",
  });
  return t("daily.assortment.learnedLine", { title: clip(title, 72) });
}

/** Optional executive one-liner when checklist exists (import-driven, no sales). */
export function getAssortmentExecutiveReportDigestLine(t: TFn): string | null {
  const s = getActiveEntitySnapshot();
  if (!s || !snapshotHasAssortmentChecklist(s.id)) return null;
  const merged = mergeStatusesIntoActions(deriveAssortmentActions(s), s.id);
  if (merged.length === 0) return null;
  const plan = buildAssortmentExecutionPlan(s.id, merged);
  const map = getAssortmentChecklistMap(s.id);
  const review = buildAssortmentExecutionReview(s.id, plan, map, t);
  if (!review) return null;
  const focus = clip(t(review.nextSuggestedFocusKey), 48);
  return t("daily.assortment.reportLine", {
    pct: String(review.completionRate),
    blocked: String(review.blockedItems.length),
    focus,
  });
}

/** Optional secondary digest (structure signals) — not wired by default. */
export function getAssortmentDailyDigestFallback(_t: TFn): AssortmentDailyDigest | null {
  const s = getActiveEntitySnapshot();
  if (!s) return null;
  const merged = mergeStatusesIntoActions(deriveAssortmentActions(s), s.id);
  const summary = summarizeAssortmentActions(merged);
  const intel = deriveSnapshotIntelligence(s);
  const sig = getCorridorPrioritySignalsFromIntel(intel);

  const growthNew = merged.filter(
    (a) =>
      a.status === "new" &&
      (a.category === "growth" || a.actionType === "launch_wave" || a.actionType === "create_collection"),
  ).length;
  const cleanupNew = merged.filter((a) => a.status === "new" && a.executiveQueues.includes("requires_cleanup")).length;
  const fboNew = merged.find((a) => a.status === "new" && a.actionType === "prepare_fbo");

  const base = {
    newCount: summary.newCount,
    criticalNew: summary.criticalNew,
    quickWinNew: summary.quickWinNew,
  };

  if (summary.quickWinNew > 0) {
    return {
      lineKey: "daily.assortment.quickWins",
      vars: { n: String(summary.quickWinNew) },
      ...base,
    };
  }

  if (fboNew?.corridor) {
    return {
      lineKey: "daily.assortment.fboReady",
      vars: { corridor: clip(fboNew.corridor, 42) },
      ...base,
    };
  }

  if (cleanupNew >= 2 && growthNew >= 1) {
    return {
      lineKey: "daily.assortment.cleanupBlocks",
      vars: {},
      ...base,
    };
  }

  if (sig.highestLeverageCorridor) {
    return {
      lineKey: "daily.assortment.leverageCorridor",
      vars: { corridor: clip(sig.highestLeverageCorridor, 42) },
      ...base,
    };
  }

  return {
    lineKey: "daily.assortment.fallback",
    vars: { new: String(summary.newCount), critical: String(summary.criticalNew) },
    ...base,
  };
}
