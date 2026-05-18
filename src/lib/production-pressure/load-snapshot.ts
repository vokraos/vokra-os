import type { ProductionLoadSnapshot } from "./capacity-types";
import type { ProductionPressureGatherContext } from "./types";

function newLoadSnapshotId(): string {
  return `pls-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildProductionLoadSnapshot(ctx: ProductionPressureGatherContext): ProductionLoadSnapshot {
  const actions = ctx.executionPlan
    ? [...ctx.executionPlan.todayActions, ...ctx.executionPlan.weekActions]
    : [];
  const fboPrepTasks = actions.filter((a) => a.actionType === "prepare_fbo").length;
  const blockedTasks = ctx.feedbackSignals.blockedCount;

  const sourceNotes: string[] = [];
  if (ctx.launchPlan) sourceNotes.push("prod.load.source.launchOps");
  if (ctx.executionPlan) sourceNotes.push("prod.load.source.assortment");
  if (ctx.visualQueueCount > 0) sourceNotes.push("prod.load.source.visualQueue");
  if (ctx.cardDraftCount > 0) sourceNotes.push("prod.load.source.cardBoard");
  if (ctx.feedbackSignals.hasOperatorFeedback) sourceNotes.push("prod.load.source.operatorFeedback");

  return {
    id: newLoadSnapshotId(),
    createdAt: Date.now(),
    activeLaunches: ctx.activeWaveCount,
    refreshTasks: ctx.refreshActionCount,
    fboPrepTasks,
    visualJobs: ctx.visualQueueCount,
    cardJobs: ctx.cardDraftCount,
    packagingLoad: ctx.cardDraftCount,
    blockedTasks,
    sourceNotes: sourceNotes.slice(0, 6),
  };
}
