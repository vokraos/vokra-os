import { gatherOperatorBriefContext } from "./gather";
import { getOperatorOverlayStatus } from "./overlay";
import { checklistStatusToOperator, execStatusToOperator } from "./status-map";
import type { OperatorTaskSource, OperatorTaskStatus } from "./types";

export type OperatorTaskSignals = {
  todayTaskCount: number;
  blockedTaskCount: number;
  visualTaskCount: number;
  cardTaskCount: number;
  launchTaskCount: number;
  dataCleanupTaskCount: number;
};

function applyOverlay(source: OperatorTaskSource, id: string, base: OperatorTaskStatus): OperatorTaskStatus {
  return getOperatorOverlayStatus(source, id) ?? base;
}

function isOpen(status: OperatorTaskStatus): boolean {
  return status !== "done" && status !== "deferred";
}

/** Task counts from raw session state only — no work order, reports, or war room. */
export function getOperatorTaskSignals(): OperatorTaskSignals {
  const ctx = gatherOperatorBriefContext();
  let todayTaskCount = 0;
  let blockedTaskCount = 0;
  let visualTaskCount = 0;
  let cardTaskCount = 0;
  let launchTaskCount = 0;
  let dataCleanupTaskCount = 0;

  if (ctx.snapshotId && ctx.executionPlan) {
    for (const action of ctx.executionPlan.todayActions) {
      const row = ctx.checklist[action.id];
      if (!row) continue;
      const status = applyOverlay("assortment", action.id, checklistStatusToOperator(row.status));
      if (status === "blocked") blockedTaskCount += 1;
      else if (isOpen(status)) todayTaskCount += 1;
    }
  }

  const countExec = (
    source: OperatorTaskSource,
    list: ReadonlyArray<{ id: string; status: Parameters<typeof execStatusToOperator>[0] }>,
    bucket: "today" | "launch",
  ) => {
    for (const a of list) {
      const status = applyOverlay(source, a.id, execStatusToOperator(a.status));
      if (status === "blocked") blockedTaskCount += 1;
      else if (isOpen(status)) {
        if (bucket === "launch") launchTaskCount += 1;
        else todayTaskCount += 1;
      }
    }
  };

  if (ctx.snapshotId) {
    countExec("hero", ctx.heroActions, "today");
    countExec("collection", ctx.collectionActions, "today");
    countExec("launch", ctx.launchActions, "launch");
  }

  for (const job of ctx.visualJobs) {
    if (job.status === "approved" || job.status === "rejected") continue;
    const status = applyOverlay("visual", job.id, "todo");
    if (status === "blocked") blockedTaskCount += 1;
    else if (isOpen(status)) visualTaskCount += 1;
  }

  for (const plan of ctx.cardPlans) {
    if (plan.cardStatus === "archived" || plan.cardStatus.startsWith("ready_")) continue;
    const base: OperatorTaskStatus = plan.cardStatus === "blocked" ? "blocked" : "todo";
    const status = applyOverlay("card", plan.id, base);
    if (status === "blocked") blockedTaskCount += 1;
    else if (isOpen(status)) cardTaskCount += 1;
  }

  if (ctx.cleanupPlan) {
    for (const batch of ctx.cleanupPlan.batchActions) {
      if (batch.status === "applied" || batch.status === "ignored") continue;
      const base: OperatorTaskStatus = batch.status === "deferred" ? "deferred" : "todo";
      const status = applyOverlay("cleanup", batch.id, base);
      if (status === "blocked") blockedTaskCount += 1;
      else if (isOpen(status)) dataCleanupTaskCount += 1;
    }
  }

  return {
    todayTaskCount,
    blockedTaskCount,
    visualTaskCount,
    cardTaskCount,
    launchTaskCount,
    dataCleanupTaskCount,
  };
}
