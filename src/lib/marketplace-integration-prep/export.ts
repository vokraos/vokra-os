import type { IntegrationReadinessReport } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

export function buildIntegrationReadinessMarkdown(report: IntegrationReadinessReport, t: TFn): string {
  const lines = [
    `# ${t("iready.export.title")}`,
    "",
    `**${t("iready.field.date")}:** ${report.dateLabel}`,
    `**${t("iready.field.readiness")}:** ${t(`iready.level.${report.readinessLevel}`)}`,
    "",
    `## ${t("iready.section.connections")}`,
    ...report.connections.map(
      (c) =>
        `- **${t(`iready.marketplace.${c.marketplace}`)}** · ${t(`iready.state.${c.connectionState}`)} · ${t(`iready.purpose.${c.connectionPurpose}`)}`,
    ),
    "",
    `## ${t("iready.section.blockers")}`,
    ...(report.readinessBlockers.length ? report.readinessBlockers.map((b) => `- ${b}`) : ["—"]),
    "",
    `## ${t("iready.section.roadmap")}`,
    ...report.roadmap.map(
      (p) => `${p.order}. ${t(p.titleKey)}${p.blocked ? ` (${t("iready.roadmap.blocked")})` : ""}`,
    ),
    "",
    `## ${t("iready.section.syncRisks")}`,
    ...report.syncRisks.map((r) => `- ${r}`),
    "",
    `## ${t("iready.section.opRisks")}`,
    ...report.operationalRisks.map((r) => `- ${r}`),
  ];
  return lines.join("\n");
}

export function buildIntegrationReadinessPlain(report: IntegrationReadinessReport, t: TFn): string {
  return buildIntegrationReadinessMarkdown(report, t).replace(/^#+ /gm, "").replace(/\*\*/g, "");
}
