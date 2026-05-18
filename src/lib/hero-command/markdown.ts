import type { HeroCommandSnapshot } from "./types";

export function heroCommandToMarkdown(
  snap: HeroCommandSnapshot,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  const lines: string[] = [
    `# ${t("hc.title")}`,
    "",
    `**${t("hc.field.query")}:** ${snap.query || "—"}`,
    `**${t("hc.field.marketplace")}:** ${snap.marketplace || "—"}`,
    `**${t("hc.next.label")}:** ${t(snap.nextStepKey)}`,
    "",
    "## Pipeline",
  ];
  for (const s of snap.stages) {
    lines.push(`- ${t(`hc.stage.${s.id}`)}: ${t(`hc.status.${s.status}`)}`);
  }
  lines.push(
    "",
    `**${t("hc.field.direction")}:** ${snap.currentDirection || "—"}`,
    `**${t("hc.field.winner")}:** ${snap.winnerVariantLabel || "—"}`,
    `**${t("hc.field.launchReadiness")}:** ${snap.launchReadiness ? t(`hc.readiness.${snap.launchReadiness}`) : "—"}`,
    `**${t("hc.field.postLaunch")}:** ${snap.postLaunchStatus ? t(`hc.postLaunch.${snap.postLaunchStatus}`) : "—"}`,
  );
  return lines.join("\n");
}

export function heroCommandToPlainText(
  snap: HeroCommandSnapshot,
  t: (key: string, vars?: Record<string, string>) => string,
): string {
  return heroCommandToMarkdown(snap, t).replace(/^#+\s/gm, "").replace(/\*\*/g, "");
}
