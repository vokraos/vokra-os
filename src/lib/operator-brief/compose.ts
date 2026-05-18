import type { NavId } from "../../types";
import { getOperatorOverlayStatus, loadOperatorBriefOverlay } from "./overlay";
import { gatherOperatorBriefContext, type OperatorBriefGatherContext } from "./gather";
import {
  checklistStatusToOperator,
  execPriorityToOperator,
  execStatusToOperator,
  priorityRank,
} from "./status-map";
import type { OperatorBrief, OperatorTask, OperatorTaskSource, OperatorTaskStatus } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function applyOverlay(source: OperatorTaskSource, id: string, base: OperatorTaskStatus): OperatorTaskStatus {
  return getOperatorOverlayStatus(source, id) ?? base;
}

function pickNext(tasks: OperatorTask[]): OperatorTask | null {
  const open = tasks.filter((t) => t.status === "todo");
  if (!open.length) return null;
  return [...open].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))[0]!;
}

export function newOperatorBriefId(): string {
  return `opb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildOperatorBrief(t: TFn, existingId?: string, ctxIn?: OperatorBriefGatherContext): OperatorBrief {
  const ctx = ctxIn ?? gatherOperatorBriefContext();
  const overlay = loadOperatorBriefOverlay();

  const todayTasks: OperatorTask[] = [];
  const blockedTasks: OperatorTask[] = [];
  const visualTasks: OperatorTask[] = [];
  const cardTasks: OperatorTask[] = [];
  const launchTasks: OperatorTask[] = [];
  const dataCleanupTasks: OperatorTask[] = [];

  if (ctx.snapshotId && ctx.executionPlan) {
    for (const action of ctx.executionPlan.todayActions) {
      const row = ctx.checklist[action.id];
      if (!row) continue;
      const base = checklistStatusToOperator(row.status);
      const status = applyOverlay("assortment", action.id, base);
      const task: OperatorTask = {
        id: action.id,
        title: row.title,
        source: "assortment",
        priority: execPriorityToOperator(action.priority),
        status,
        instruction: row.reason || t("opm.instruction.assortment"),
        destination: "assortmentActions",
      };
      if (status === "blocked") blockedTasks.push(task);
      else if (status !== "done" && status !== "deferred") todayTasks.push(task);
    }
  }

  const pushExec = (
    source: OperatorTaskSource,
    list: ReadonlyArray<{
      id: string;
      title: string;
      reason: string;
      priority: "critical" | "high" | "medium" | "low";
      status: Parameters<typeof execStatusToOperator>[0];
      suggestedDestination: NavId;
    }>,
    bucket: OperatorTask[],
    dest: NavId,
  ) => {
    for (const a of list) {
      const base = execStatusToOperator(a.status);
      const status = applyOverlay(source, a.id, base);
      const task: OperatorTask = {
        id: a.id,
        title: a.title,
        source,
        priority: execPriorityToOperator(a.priority),
        status,
        instruction: a.reason,
        destination: a.suggestedDestination ?? dest,
      };
      if (status === "blocked") blockedTasks.push(task);
      else if (status !== "done" && status !== "deferred") bucket.push(task);
    }
  };

  if (ctx.snapshotId) {
    pushExec("hero", ctx.heroActions, todayTasks, "heroCommand");
    pushExec("collection", ctx.collectionActions, todayTasks, "collectionBuilder");
    pushExec("launch", ctx.launchActions, launchTasks, "launchOperations");
  }

  for (const job of ctx.visualJobs) {
    if (job.status === "approved" || job.status === "rejected") continue;
    const base: OperatorTaskStatus = "todo";
    const status = applyOverlay("visual", job.id, base);
    if (status === "done" || status === "deferred") continue;
    const task: OperatorTask = {
      id: job.id,
      title: job.title,
      source: "visual",
      priority: job.priority >= 70 ? "high" : job.priority >= 40 ? "medium" : "low",
      status,
      instruction: job.expectedOutput || t("opm.instruction.visual"),
      destination: "visualProduction",
    };
    if (status === "blocked") blockedTasks.push(task);
    else visualTasks.push(task);
  }

  for (const plan of ctx.cardPlans) {
    if (plan.cardStatus === "archived" || plan.cardStatus.startsWith("ready_")) continue;
    const base: OperatorTaskStatus = plan.cardStatus === "blocked" ? "blocked" : "todo";
    const status = applyOverlay("card", plan.id, base);
    if (status === "done" || status === "deferred") continue;
    const blockers = plan.blockers.length ? plan.blockers.join("; ") : plan.readiness;
    const task: OperatorTask = {
      id: plan.id,
      title: plan.cardTitle || plan.targetSkuFamily,
      source: "card",
      priority: plan.cardStatus === "blocked" ? "high" : "medium",
      status,
      instruction: blockers || t("opm.instruction.card"),
      destination: "cardProduction",
    };
    if (status === "blocked") blockedTasks.push(task);
    else cardTasks.push(task);
  }

  if (ctx.cleanupPlan) {
    for (const batch of ctx.cleanupPlan.batchActions) {
      if (batch.status === "applied" || batch.status === "ignored") continue;
      const base: OperatorTaskStatus = batch.status === "deferred" ? "deferred" : "todo";
      const status = applyOverlay("cleanup", batch.id, base);
      if (status === "done" || status === "deferred") continue;
      const task: OperatorTask = {
        id: batch.id,
        title: t(batch.titleKey, batch.vars),
        source: "cleanup",
        priority: batch.confidence === "high" ? "high" : "medium",
        status,
        instruction: t(batch.reasonKey, batch.vars),
        destination: "dataCleanup",
      };
      if (status === "blocked") blockedTasks.push(task);
      else dataCleanupTasks.push(task);
    }
  }

  const allToday = [...todayTasks, ...launchTasks.filter((x) => x.status === "todo")];
  const nextAction = pickNext(allToday) ?? pickNext([...visualTasks, ...cardTasks, ...dataCleanupTasks]);

  return {
    id: existingId ?? newOperatorBriefId(),
    createdAt: Date.now(),
    todayTasks,
    blockedTasks,
    visualTasks,
    cardTasks,
    launchTasks: launchTasks.filter((x) => x.status !== "blocked"),
    dataCleanupTasks,
    notes: overlay.notes,
    nextAction,
    confidenceNoteKey: ctx.snapshot ? "opm.confidence.honest" : "opm.confidence.noSnapshot",
  };
}
