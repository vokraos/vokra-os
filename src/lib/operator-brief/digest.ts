import { buildOperatorBrief } from "./compose";
import { OPERATOR_BRIEF_EVENT } from "./types";
import type { OperatorBrief } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export { OPERATOR_BRIEF_EVENT };

export function notifyOperatorBriefUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPERATOR_BRIEF_EVENT));
}

export function formatOperatorModeDailyLine(brief: OperatorBrief | null, t: TFn): string | null {
  if (!brief) return null;
  const open =
    brief.todayTasks.filter((x) => x.status === "todo").length +
    brief.visualTasks.filter((x) => x.status === "todo").length +
    brief.cardTasks.filter((x) => x.status === "todo").length +
    brief.launchTasks.filter((x) => x.status === "todo").length +
    brief.dataCleanupTasks.filter((x) => x.status === "todo").length;
  if (open <= 0) return null;
  return t("opm.daily.line", { n: String(open) });
}

export function getOperatorTodayCount(t: TFn): number {
  const brief = buildOperatorBrief(t);
  return (
    brief.todayTasks.filter((x) => x.status === "todo").length +
    brief.visualTasks.filter((x) => x.status === "todo").length +
    brief.cardTasks.filter((x) => x.status === "todo").length +
    brief.launchTasks.filter((x) => x.status === "todo").length +
    brief.dataCleanupTasks.filter((x) => x.status === "todo").length
  );
}
