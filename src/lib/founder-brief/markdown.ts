import type { FounderCommandBrief } from "./types";
import { buildConstraintDisplay, isNominalBlocked } from "./digest";

type TFn = (key: string, vars?: Record<string, string>) => string;

function row(label: string, text: string): string {
  return `**${label}:** ${text}`;
}

export function founderBriefToMarkdown(brief: FounderCommandBrief, t: TFn): string {
  const constraint = buildConstraintDisplay(brief, t);
  const primaryRows: string[] = [];
  if (!isNominalBlocked(brief.topBlockedItem.text, t)) {
    primaryRows.push(row(t("fbrief.primary.blocked"), brief.topBlockedItem.text));
  }
  primaryRows.push(row(t("fbrief.primary.action"), brief.topTodayAction.text));
  primaryRows.push(row(t("fbrief.primary.leverage"), brief.highestLeverageMove.text));
  if (constraint) primaryRows.push(row(t("fbrief.primary.constraint"), constraint.text));

  const primary = [
    `# ${t("fbrief.export.title")}`,
    "",
    `*${new Date(brief.createdAt).toLocaleString()}*`,
    "",
    ...primaryRows,
  ];

  const context = [
    "",
    `## ${t("fbrief.context.title")}`,
    "",
    row(t("fbrief.row.snapshot"), brief.activeSnapshotSummary),
    row(t("fbrief.row.change"), brief.sinceLastReview),
    row(t("fbrief.row.hero"), brief.heroStatus.text),
    row(t("fbrief.row.launch"), brief.launchStatus.text),
    row(t("fbrief.row.collection"), brief.collectionStatus.text),
    row(t("fbrief.row.data"), brief.dataStatus.text),
    row(t("fbrief.row.execution"), brief.executionStatus.text),
    row(t("fbrief.row.memory"), brief.memorySignal.text),
    row(t("fbrief.row.route"), brief.nextBestRoute.text),
    "",
    `> ${brief.confidenceNote}`,
    "",
    `---`,
    `*${t("fbrief.export.footer")}*`,
  ];

  return [...primary, ...context].join("\n");
}

export function founderBriefToPlainText(brief: FounderCommandBrief, t: TFn): string {
  return founderBriefToMarkdown(brief, t).replace(/^#+\s/gm, "").replace(/\*\*/g, "");
}
