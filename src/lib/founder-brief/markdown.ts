import type { FounderCommandBrief } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function row(label: string, text: string): string {
  return `**${label}:** ${text}`;
}

export function founderBriefToMarkdown(brief: FounderCommandBrief, t: TFn): string {
  const lines = [
    `# ${t("fbrief.export.title")}`,
    "",
    `*${new Date(brief.createdAt).toLocaleString()}*`,
    "",
    row(t("fbrief.row.snapshot"), brief.activeSnapshotSummary),
    row(t("fbrief.row.change"), brief.sinceLastReview),
    row(t("fbrief.row.today"), brief.topTodayAction.text),
    row(t("fbrief.row.blocked"), brief.topBlockedItem.text),
    row(t("fbrief.row.leverage"), brief.highestLeverageMove.text),
    row(t("fbrief.row.hero"), brief.heroStatus.text),
    row(t("fbrief.row.launch"), brief.launchStatus.text),
    row(t("fbrief.row.collection"), brief.collectionStatus.text),
    row(t("fbrief.row.data"), brief.dataStatus.text),
    row(t("fbrief.row.execution"), brief.executionStatus.text),
    row(t("fbrief.row.memory"), brief.memorySignal.text),
    row(t("fbrief.row.dnt"), brief.doNotTouch.text),
    row(t("fbrief.row.route"), brief.nextBestRoute.text),
    "",
    `> ${brief.confidenceNote}`,
    "",
    `---`,
    `*${t("fbrief.export.footer")}*`,
  ];
  return lines.join("\n");
}

export function founderBriefToPlainText(brief: FounderCommandBrief, t: TFn): string {
  return founderBriefToMarkdown(brief, t).replace(/^#+\s/gm, "").replace(/\*\*/g, "");
}
