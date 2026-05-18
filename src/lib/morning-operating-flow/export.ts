import type { MorningOperatingFlow } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildMorningFlowMarkdown(flow: MorningOperatingFlow, t: TFn): string {
  const lines = [
    `# ${t("mflow.export.title")}`,
    "",
    `**${t("mflow.field.date")}:** ${flow.dateLabel}`,
    `**${t("mflow.field.mode")}:** ${t(`orm.mode.${flow.roleMode}`)}`,
    `**${t("mflow.field.readiness")}:** ${t(`mflow.readiness.${flow.readiness}`)}`,
    "",
    `## ${t("mflow.section.progress")}`,
    "",
  ];
  for (const step of flow.steps) {
    const mark =
      step.status === "done" ? "✓" : step.status === "blocked" ? "✗" : "○";
    lines.push(`- ${mark} ${t(step.titleKey)}`);
  }
  lines.push("", `## ${t("mflow.section.next")}`, "", flow.nextAction.text);
  if (flow.startSnapshot) {
    lines.push(
      "",
      `## ${t("mflow.section.snapshot")}`,
      "",
      `**${t("dwr.field.state")}:** ${t(`dwr.state.${flow.startSnapshot.dailyState}`)}`,
    );
  }
  lines.push("", "---", t(flow.confidenceNote));
  return lines.join("\n");
}

export function buildMorningFlowPlain(flow: MorningOperatingFlow, t: TFn): string {
  return buildMorningFlowMarkdown(flow, t).replace(/\*\*/g, "").replace(/^#+ /gm, "");
}
