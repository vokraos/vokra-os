import { buildOperatorBrief } from "../operator-brief/compose";
import { buildOperatorWorkOrder } from "../operator-brief/work-order";
import type { AppLocale } from "../i18n/messages";
import type { OperatorBrief, OperatorTask, OperatorWorkOrder } from "../operator-brief/types";
import { operatorTaskKey } from "../operator-brief/task-key";
import { loadExecutionFeedbackOverlay } from "./overlay";
import type { ExecutionFeedbackReport, ExecutionFeedbackTaskItem } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function toItem(task: OperatorTask): ExecutionFeedbackTaskItem {
  return {
    taskKey: operatorTaskKey(task.source, task.id),
    source: task.source,
    id: task.id,
    title: task.title,
  };
}

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

function uniqueByKey(items: ExecutionFeedbackTaskItem[]): ExecutionFeedbackTaskItem[] {
  const seen = new Set<string>();
  const out: ExecutionFeedbackTaskItem[] = [];
  for (const item of items) {
    if (seen.has(item.taskKey)) continue;
    seen.add(item.taskKey);
    out.push(item);
  }
  return out;
}

function deriveProblemsAndFixes(
  blocked: ExecutionFeedbackTaskItem[],
  unclear: ExecutionFeedbackTaskItem[],
  delayed: ExecutionFeedbackTaskItem[],
  repeated: ExecutionFeedbackTaskItem[],
  deferredCount: number,
): { problems: string[]; fixes: string[] } {
  const problems: string[] = [];
  const fixes: string[] = [];

  const unclearVisual = unclear.filter((t) => t.source === "visual").length;
  const delayedLaunch = delayed.filter((t) => t.source === "launch").length;

  if (blocked.length >= 2) {
    problems.push("efb.problem.repeatedBlocked");
    fixes.push("efb.fix.unblockOrDescope");
  }
  if (unclearVisual >= 1) {
    problems.push("efb.problem.unclearVisual");
    fixes.push("efb.fix.clarifyVisualBrief");
  }
  if (delayedLaunch >= 1) {
    problems.push("efb.problem.launchDelays");
    fixes.push("efb.fix.narrowLaunchScope");
  }
  if (delayed.length >= 2) {
    problems.push("efb.problem.timingOverload");
    fixes.push("efb.fix.reduceTodayLoad");
  }
  if (deferredCount >= 3) {
    problems.push("efb.problem.cadenceDefer");
    fixes.push("efb.fix.replanWeek");
  }
  if (repeated.length >= 2) {
    problems.push("efb.problem.repeatTomorrow");
    fixes.push("efb.fix.prioritizeCarry");
  }
  if (!problems.length && (unclear.length || delayed.length || blocked.length)) {
    problems.push("efb.problem.shiftFriction");
    fixes.push("efb.fix.reviewInstructions");
  }

  return { problems: [...new Set(problems)], fixes: [...new Set(fixes)].slice(0, 6) };
}

export function newExecutionFeedbackReportId(): string {
  return `efb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildExecutionFeedbackReport(
  t: TFn,
  locale: AppLocale,
  existingId?: string,
  briefIn?: OperatorBrief,
  workOrderIn?: OperatorWorkOrder,
): ExecutionFeedbackReport {
  const overlay = loadExecutionFeedbackOverlay();
  const brief = briefIn ?? buildOperatorBrief(t);
  const workOrder = workOrderIn ?? buildOperatorWorkOrder(brief, t, locale, overlay.sourceWorkOrderId ?? undefined);

  const completedTasks: ExecutionFeedbackTaskItem[] = [];
  const blockedTasks: ExecutionFeedbackTaskItem[] = [];
  const unclearTasks: ExecutionFeedbackTaskItem[] = [];
  const delayedTasks: ExecutionFeedbackTaskItem[] = [];
  const repeatedTomorrow: ExecutionFeedbackTaskItem[] = [];
  let deferredCount = 0;

  for (const task of allTasks(brief)) {
    const flags = overlay.byTaskKey[operatorTaskKey(task.source, task.id)] ?? {};
    const item = toItem(task);

    if (task.status === "done") completedTasks.push(item);
    if (task.status === "blocked") blockedTasks.push(item);
    if (task.status === "deferred") deferredCount += 1;
    if (flags.unclear) unclearTasks.push(item);
    if (flags.delayed) delayedTasks.push(item);
    if (flags.repeatTomorrow) repeatedTomorrow.push(item);
  }

  const { problems, fixes } = deriveProblemsAndFixes(
    uniqueByKey(blockedTasks),
    uniqueByKey(unclearTasks),
    uniqueByKey(delayedTasks),
    uniqueByKey(repeatedTomorrow),
    deferredCount,
  );

  return {
    id: existingId ?? newExecutionFeedbackReportId(),
    createdAt: Date.now(),
    sourceWorkOrderId: workOrder.id,
    completedTasks: uniqueByKey(completedTasks),
    blockedTasks: uniqueByKey(blockedTasks),
    unclearTasks: uniqueByKey(unclearTasks),
    delayedTasks: uniqueByKey(delayedTasks),
    repeatedTomorrow: uniqueByKey(repeatedTomorrow),
    operatorNotes: overlay.operatorNotes.trim(),
    founderNotes: overlay.founderNotes.trim(),
    operationalProblems: problems,
    recommendedFixes: fixes,
    confidenceNoteKey: brief.nextAction ? "efb.confidence.honest" : "efb.confidence.quiet",
  };
}
