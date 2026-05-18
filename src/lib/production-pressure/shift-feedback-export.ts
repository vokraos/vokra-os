import type { ProductionShiftFeedback } from "./shift-feedback-types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function lines(items: string[]): string[] {
  return items.length ? items.map((x) => `- ${x}`) : ["- —"];
}

export function buildProductionShiftFeedbackMarkdown(feedback: ProductionShiftFeedback, t: TFn): string {
  return [
    `# ${t("prod.feedback.export.title")}`,
    "",
    `**${t("prod.feedback.field.date")}:** ${feedback.shiftDate}`,
    `**${t("prod.feedback.field.mismatch")}:** ${t(`prod.feedback.mismatch.${feedback.capacityMismatch}`)}`,
    "",
    `## ${t("prod.feedback.field.completed")}`,
    ...lines(feedback.completedFocus),
    "",
    `## ${t("prod.feedback.field.delayed")}`,
    ...lines(feedback.delayedItems),
    "",
    `## ${t("prod.feedback.field.bottlenecks")}`,
    ...lines(feedback.bottlenecksFound),
    "",
    `## ${t("prod.feedback.field.overload")}`,
    ...lines(feedback.overloadAreas.map((a) => t(`prod.feedback.overload.${a}`))),
    "",
    `## ${t("prod.feedback.field.capacityAdj")}`,
    feedback.recommendedCapacityAdjustment.startsWith("prod.")
      ? t(feedback.recommendedCapacityAdjustment)
      : feedback.recommendedCapacityAdjustment || "—",
    "",
    `## ${t("prod.feedback.field.nextShift")}`,
    feedback.nextShiftRecommendation.startsWith("prod.")
      ? t(feedback.nextShiftRecommendation)
      : feedback.nextShiftRecommendation || "—",
    "",
    feedback.operatorNotes ? `## ${t("prod.feedback.field.operator")}\n${feedback.operatorNotes}\n` : "",
    feedback.founderNotes ? `## ${t("prod.feedback.field.founder")}\n${feedback.founderNotes}\n` : "",
    `---`,
    t(feedback.confidenceNote),
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildProductionShiftFeedbackPlain(feedback: ProductionShiftFeedback, t: TFn): string {
  return buildProductionShiftFeedbackMarkdown(feedback, t)
    .replace(/\*\*/g, "")
    .replace(/^#+ /gm, "");
}
