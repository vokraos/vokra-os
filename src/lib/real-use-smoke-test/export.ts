import type { RealUseSmokeTest } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function bullets(title: string, items: string[]): string[] {
  if (!items.length) return [`### ${title}`, "—", ""];
  return [`### ${title}`, ...items.map((x) => `- ${x}`), ""];
}

export function buildRealUseTestMarkdown(test: RealUseSmokeTest, t: TFn): string {
  const lines = [
    `# ${t("rtest.export.title")}`,
    "",
    `**${t("rtest.field.scenario")}:** ${t(`rtest.scenario.${test.scenarioType}`)}`,
    `**${t("rtest.field.verdict")}:** ${t(`rtest.verdict.${test.finalVerdict}`)}`,
    "",
    ...bullets(
      t("rtest.section.steps"),
      test.steps.map((s) => `${t(s.titleKey)} — ${t(`rtest.status.${s.status}`)}`),
    ),
    ...bullets(t("rtest.section.friction"), test.observedFriction),
    ...bullets(
      t("rtest.section.useful"),
      test.usefulScreens.map((id) => t(`rtest.step.${id}`)),
    ),
    ...bullets(
      t("rtest.section.confusing"),
      test.confusingScreens.map((id) => t(`rtest.step.${id}`)),
    ),
    ...bullets(t("rtest.section.missing"), test.missingData),
  ];

  if (test.simplification) {
    lines.push(
      ...bullets(t("rtest.section.used"), test.simplification.screensUsed),
      ...bullets(t("rtest.section.ignored"), test.simplification.screensIgnored),
      ...bullets(t("rtest.section.confusingAreas"), test.simplification.confusingAreas),
      ...bullets(t("rtest.section.simplify"), test.recommendedSimplifications),
      ...bullets(t("rtest.section.fixes"), test.simplification.recommendedNextBuildFixes),
    );
  }

  return lines.join("\n");
}

export function buildRealUseTestPlain(test: RealUseSmokeTest, t: TFn): string {
  return buildRealUseTestMarkdown(test, t).replace(/^#+ /gm, "").replace(/\*\*/g, "");
}
