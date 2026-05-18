import type { AppLocale } from "../i18n/messages";
import { getWarRoomSignals } from "../daily-war-room/signals";
import { productionDailyPlanToDisplay } from "../production-pressure/daily-plan-export";
import { peekProductionPressureSession } from "../production-pressure/session";
import { priorityRank } from "./status-map";
import type { OperatorBrief, OperatorTask, OperatorWorkOrder, OperatorWorkOrderLine } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

const REPORT_BACK_KEYS = [
  "opm.wo.report.q1",
  "opm.wo.report.q2",
  "opm.wo.report.q3",
  "opm.wo.report.q4",
  "opm.wo.report.q5",
] as const;

const CHECK_KEYS = ["opm.wo.check.1", "opm.wo.check.2", "opm.wo.check.3", "opm.wo.check.4"] as const;

function formatDateLabel(locale: AppLocale): string {
  return new Date().toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function openTasks(tasks: OperatorTask[]): OperatorTask[] {
  return tasks.filter((t) => t.status === "todo");
}

function taskLine(task: OperatorTask): OperatorWorkOrderLine {
  return { label: task.title, detail: task.instruction };
}

function sortOpen(tasks: OperatorTask[]): OperatorTask[] {
  return [...openTasks(tasks)].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

export function newOperatorWorkOrderId(): string {
  return `owo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export type BuildOperatorWorkOrderOptions = {
  /** Skip production / war-room sections (safe mode). */
  minimalComposition?: boolean;
};

export function buildOperatorWorkOrder(
  brief: OperatorBrief,
  t: TFn,
  locale: AppLocale,
  existingId?: string,
  options?: BuildOperatorWorkOrderOptions,
): OperatorWorkOrder {
  const minimal = options?.minimalComposition ?? false;
  const priorityTasks: OperatorWorkOrderLine[] = [];

  if (brief.nextAction && brief.nextAction.status === "todo") {
    priorityTasks.push({
      label: t("opm.wo.priority.first", { title: brief.nextAction.title }),
      detail: brief.nextAction.instruction,
    });
  }

  for (const task of sortOpen(brief.todayTasks)) {
    if (brief.nextAction?.id === task.id && brief.nextAction.source === task.source) continue;
    priorityTasks.push(taskLine(task));
  }

  const blockedItems = brief.blockedTasks.map(taskLine);

  const planDisplay = minimal
    ? { doFirst: [], delay: [], avoid: [], bottleneckWatch: [], reportBackQuestions: [] as string[] }
    : (() => {
        const prodReport = peekProductionPressureSession()?.report ?? null;
        return prodReport
          ? productionDailyPlanToDisplay(prodReport.dailyPlan, t)
          : { doFirst: [], delay: [], avoid: [], bottleneckWatch: [], reportBackQuestions: [] as string[] };
      })();
  const productionDoFirst = planDisplay.doFirst.map((label) => ({ label }));
  const productionDelay = planDisplay.delay.map((label) => ({
    label,
    detail: t("opm.plan.delayTag"),
  }));
  const productionAvoid = planDisplay.avoid.map((label) => ({
    label,
    detail: t("opm.plan.avoidTag"),
  }));
  const productionBottleneckWatch = planDisplay.bottleneckWatch;

  const warRoomCached = minimal ? null : getWarRoomSignals()?.snapshot ?? null;
  const warRoomTeamInstructions = (warRoomCached?.teamInstructions ?? [])
    .slice(0, 6)
    .map((x) => ({ label: x.text }));
  const warRoomWatchList = (warRoomCached?.watchList ?? []).slice(0, 6).map((x) => x.text);
  const warRoomBlockedItems = (warRoomCached?.blockedItems ?? [])
    .slice(0, 6)
    .map((x) => ({ label: x.text }));

  return {
    id: existingId ?? newOperatorWorkOrderId(),
    createdAt: Date.now(),
    dateLabel: formatDateLabel(locale),
    priorityTasks,
    visualTasks: sortOpen(brief.visualTasks).map(taskLine),
    cardTasks: sortOpen(brief.cardTasks).map(taskLine),
    launchTasks: sortOpen(brief.launchTasks).map(taskLine),
    dataTasks: sortOpen(brief.dataCleanupTasks).map(taskLine),
    blockedItems,
    productionDoFirst,
    productionDelay,
    productionAvoid,
    productionBottleneckWatch,
    warRoomTeamInstructions,
    warRoomWatchList,
    warRoomBlockedItems,
    checkBeforeFinish: CHECK_KEYS.map((k) => t(k)),
    reportBackQuestions: [
      ...planDisplay.reportBackQuestions.slice(0, 4),
      ...REPORT_BACK_KEYS.map((k) => t(k)),
    ].slice(0, 8),
    notes: brief.notes.trim(),
  };
}
