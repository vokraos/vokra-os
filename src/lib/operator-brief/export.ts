import type { OperatorBrief, OperatorTask } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function section(title: string, tasks: OperatorTask[], t: TFn): string[] {
  if (!tasks.length) return [`## ${title}`, "", t("opm.export.none"), ""];
  const lines = [`## ${title}`, ""];
  for (const task of tasks) {
    lines.push(`- **${task.title}** (${t(`opm.source.${task.source}`)})`);
    lines.push(`  - ${t("opm.export.status")}: ${t(`opm.state.${task.status}`)}`);
    lines.push(`  - ${t("opm.export.instruction")}: ${task.instruction}`);
  }
  lines.push("");
  return lines;
}

export function buildOperatorBriefMarkdown(brief: OperatorBrief, t: TFn): string {
  const lines: string[] = [
    `# ${t("opm.export.title")}`,
    "",
    `_${t(brief.confidenceNoteKey)}_`,
    "",
  ];

  if (brief.nextAction) {
    lines.push(`## ${t("opm.section.next")}`, "");
    lines.push(`**${brief.nextAction.title}**`, "");
    lines.push(brief.nextAction.instruction, "");
  }

  lines.push(...section(t("opm.section.today"), brief.todayTasks, t));
  lines.push(...section(t("opm.section.visual"), brief.visualTasks, t));
  lines.push(...section(t("opm.section.card"), brief.cardTasks, t));
  lines.push(...section(t("opm.section.launch"), brief.launchTasks, t));
  lines.push(...section(t("opm.section.cleanup"), brief.dataCleanupTasks, t));
  lines.push(...section(t("opm.section.blocked"), brief.blockedTasks, t));

  if (brief.notes.trim()) {
    lines.push(`## ${t("opm.section.notes")}`, "", brief.notes.trim(), "");
  }

  return lines.join("\n");
}

export function buildOperatorBriefPlain(brief: OperatorBrief, t: TFn): string {
  return buildOperatorBriefMarkdown(brief, t).replace(/\*\*/g, "").replace(/^#+ /gm, "");
}
