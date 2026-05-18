import type { DailyWarRoomSnapshot, WarRoomLine } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function bullets(title: string, items: WarRoomLine[]): string[] {
  const out = [`## ${title}`, ""];
  if (!items.length) {
    out.push("- —", "");
    return out;
  }
  for (const item of items) out.push(`- ${item.text}`);
  out.push("");
  return out;
}

function focusLine(label: string, line: WarRoomLine): string[] {
  return [`**${label}:** ${line.text}`, ""];
}

export function buildDailyWarRoomMarkdown(snapshot: DailyWarRoomSnapshot, t: TFn): string {
  return [
    `# ${t("dwr.export.title")}`,
    "",
    `**${t("dwr.field.date")}:** ${snapshot.dateLabel}`,
    `**${t("dwr.field.state")}:** ${t(`dwr.state.${snapshot.dailyState}`)}`,
    "",
    `## ${t("dwr.section.focus")}`,
    ...focusLine(t("dwr.focus.founder"), snapshot.founderFocus),
    ...focusLine(t("dwr.focus.operator"), snapshot.operatorFocus),
    ...focusLine(t("dwr.focus.production"), snapshot.productionFocus),
    ...focusLine(t("dwr.focus.launch"), snapshot.launchFocus),
    ...focusLine(t("dwr.focus.hero"), snapshot.heroFocus),
    ...focusLine(t("dwr.focus.scaling"), snapshot.scalingFocus),
    ...bullets(t("dwr.section.team"), snapshot.teamInstructions),
    ...bullets(t("dwr.section.watch"), snapshot.watchList),
    ...bullets(t("dwr.section.blocked"), snapshot.blockedItems),
    ...bullets(t("dwr.section.postpone"), snapshot.postponeItems),
    ...bullets(t("dwr.section.decisions"), snapshot.founderDecisions),
    ...focusLine(t("dwr.section.route"), snapshot.nextRoute),
    "---",
    t(snapshot.confidenceNote),
  ].join("\n");
}

export function buildDailyWarRoomPlain(snapshot: DailyWarRoomSnapshot, t: TFn): string {
  return buildDailyWarRoomMarkdown(snapshot, t)
    .replace(/\*\*/g, "")
    .replace(/^#+ /gm, "");
}
