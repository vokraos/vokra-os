import type { CloseLine, EveningCloseSnapshot } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function bullets(title: string, items: CloseLine[]): string[] {
  const out = [`## ${title}`, ""];
  if (!items.length) {
    out.push("- —", "");
    return out;
  }
  for (const item of items) out.push(`- ${item.text}`);
  out.push("");
  return out;
}

export function buildEveningCloseMarkdown(snapshot: EveningCloseSnapshot, t: TFn): string {
  return [
    `# ${t("eclose.export.title")}`,
    "",
    `**${t("eclose.field.date")}:** ${snapshot.dateLabel}`,
    `**${t("eclose.field.todayState")}:** ${t(`dwr.state.${snapshot.dailyState}`)}`,
    `**${t("eclose.field.tomorrow")}:** ${t(`eclose.tomorrow.${snapshot.tomorrowReadiness}`)}`,
    "",
    ...bullets(t("eclose.section.completed"), snapshot.completedToday),
    ...bullets(t("eclose.section.delayed"), snapshot.delayedToday),
    ...bullets(t("eclose.section.blocked"), snapshot.blockedToday),
    ...bullets(t("eclose.section.overload"), snapshot.overloadedAreas),
    ...bullets(t("eclose.section.production"), snapshot.productionIssues),
    ...bullets(t("eclose.section.launch"), snapshot.launchIssues),
    ...bullets(t("eclose.section.hero"), snapshot.heroIssues),
    ...bullets(t("eclose.section.operator"), snapshot.operatorIssues),
    ...bullets(t("eclose.section.decisions"), snapshot.founderDecisionsForTomorrow),
    ...bullets(t("eclose.section.carry"), snapshot.tomorrowCarryForward),
    ...bullets(t("eclose.section.warnings"), snapshot.tomorrowWarnings),
    ...bullets(t("eclose.section.preload"), snapshot.preloadMorningFocus),
    "---",
    t(snapshot.confidenceNote),
  ].join("\n");
}

export function buildEveningClosePlain(snapshot: EveningCloseSnapshot, t: TFn): string {
  return buildEveningCloseMarkdown(snapshot, t).replace(/\*\*/g, "").replace(/^#+ /gm, "");
}
