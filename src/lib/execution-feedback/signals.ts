import { buildOperatorBrief } from "../operator-brief/compose";
import type { OperatorBrief, OperatorTask } from "../operator-brief/types";
import { operatorTaskKey } from "../operator-brief/task-key";
import type { CapacityMismatchType } from "../production-pressure/shift-feedback-types";
import { loadExecutionFeedbackOverlay } from "./overlay";

/** Lightweight execution feedback state — no reports, no work orders, no compose chains. */
export type ExecutionFeedbackSignals = {
  delayedCount: number;
  blockedCount: number;
  overloadAreas: string[];
  repeatedMismatch: CapacityMismatchType;
  repeatTomorrowCount: number;
  /** True when overlay or task flags carry operator feedback. */
  hasOperatorFeedback: boolean;
};

type TFn = (key: string, vars?: Record<string, string>) => string;

const OVERLOAD_FROM_SOURCE: Partial<Record<OperatorTask["source"], string>> = {
  launch: "launch",
  visual: "visual",
  card: "cards",
  cleanup: "blocked",
};

function allTasks(brief: OperatorBrief): OperatorTask[] {
  return [
    ...brief.todayTasks,
    ...brief.visualTasks,
    ...brief.cardTasks,
    ...brief.launchTasks,
    ...brief.dataCleanupTasks,
    ...brief.blockedTasks,
  ];
}

function inferMismatchFromOverload(areas: string[]): CapacityMismatchType {
  const map: Record<string, CapacityMismatchType> = {
    launch: "launch_load_underestimated",
    fbo: "fbo_prep_underestimated",
    visual: "visual_jobs_underestimated",
    cards: "card_jobs_underestimated",
    packaging: "packaging_underestimated",
    blocked: "blocked_tasks_underestimated",
  };
  for (const a of areas) {
    const m = map[a];
    if (m) return m;
  }
  return "none";
}

function deriveOverloadAreas(
  delayedBySource: Map<string, number>,
  blockedCount: number,
  unclearBySource: Map<string, number>,
): string[] {
  const areas: string[] = [];
  for (const [source, n] of delayedBySource) {
    if (n >= 1) {
      const area = OVERLOAD_FROM_SOURCE[source as OperatorTask["source"]];
      if (area) areas.push(area);
    }
  }
  for (const [source, n] of unclearBySource) {
    if (n >= 2) {
      const area = OVERLOAD_FROM_SOURCE[source as OperatorTask["source"]];
      if (area && !areas.includes(area)) areas.push(area);
    }
  }
  if (blockedCount >= 2) areas.push("blocked");
  return [...new Set(areas)];
}

/**
 * Raw execution feedback counters for upstream modules (e.g. Production Pressure).
 * Must not call buildExecutionFeedbackReport or buildOperatorWorkOrder.
 */
export function getExecutionFeedbackSignals(_t?: TFn): ExecutionFeedbackSignals {
  const overlay = loadExecutionFeedbackOverlay();
  const brief = buildOperatorBrief(_t ?? ((k) => k));

  let delayedCount = 0;
  let blockedCount = 0;
  let repeatTomorrowCount = 0;
  const delayedBySource = new Map<string, number>();
  const unclearBySource = new Map<string, number>();

  for (const task of allTasks(brief)) {
    const flags = overlay.byTaskKey[operatorTaskKey(task.source, task.id)] ?? {};
    if (task.status === "blocked") blockedCount += 1;
    if (flags.delayed) {
      delayedCount += 1;
      delayedBySource.set(task.source, (delayedBySource.get(task.source) ?? 0) + 1);
    }
    if (flags.repeatTomorrow) repeatTomorrowCount += 1;
    if (flags.unclear) {
      unclearBySource.set(task.source, (unclearBySource.get(task.source) ?? 0) + 1);
    }
  }

  const overloadAreas = deriveOverloadAreas(delayedBySource, blockedCount, unclearBySource);
  const repeatedMismatch = inferMismatchFromOverload(overloadAreas);

  const hasOperatorFeedback =
    Boolean(overlay.operatorNotes.trim()) ||
    Boolean(overlay.founderNotes.trim()) ||
    delayedCount > 0 ||
    blockedCount > 0 ||
    repeatTomorrowCount > 0 ||
    Object.keys(overlay.byTaskKey).length > 0;

  return {
    delayedCount,
    blockedCount,
    overloadAreas,
    repeatedMismatch,
    repeatTomorrowCount,
    hasOperatorFeedback,
  };
}
