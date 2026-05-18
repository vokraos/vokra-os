import type { ExecutionFeedbackReport, ExecutionFeedbackTaskItem } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function taskList(title: string, items: ExecutionFeedbackTaskItem[]): string[] {
  const out = [`## ${title}`, ""];
  if (!items.length) {
    out.push("—", "");
    return out;
  }
  for (const item of items) out.push(`- ${item.title}`);
  out.push("");
  return out;
}

export function buildExecutionFeedbackMarkdown(report: ExecutionFeedbackReport, t: TFn): string {
  const lines: string[] = [
    `# ${t("efb.export.title")}`,
    "",
    `_${t(report.confidenceNoteKey)}_`,
    "",
    ...taskList(t("efb.export.completed"), report.completedTasks),
    ...taskList(t("efb.export.blocked"), report.blockedTasks),
    ...taskList(t("efb.export.unclear"), report.unclearTasks),
    ...taskList(t("efb.export.delayed"), report.delayedTasks),
    ...taskList(t("efb.export.repeat"), report.repeatedTomorrow),
  ];

  if (report.operationalProblems.length) {
    lines.push(`## ${t("efb.export.problems")}`, "");
    for (const k of report.operationalProblems) lines.push(`- ${t(k)}`);
    lines.push("");
  }

  if (report.recommendedFixes.length) {
    lines.push(`## ${t("efb.export.fixes")}`, "");
    for (const k of report.recommendedFixes) lines.push(`- ${t(k)}`);
    lines.push("");
  }

  if (report.operatorNotes) {
    lines.push(`## ${t("efb.export.operatorNotes")}`, "", report.operatorNotes, "");
  }
  if (report.founderNotes) {
    lines.push(`## ${t("efb.export.founderNotes")}`, "", report.founderNotes, "");
  }

  return lines.join("\n").trimEnd();
}

export function buildExecutionFeedbackPlain(report: ExecutionFeedbackReport, t: TFn): string {
  return buildExecutionFeedbackMarkdown(report, t).replace(/\*\*/g, "").replace(/^#+ /gm, "");
}
