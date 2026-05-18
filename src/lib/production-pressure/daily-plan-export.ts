import type { ProductionDailyPlan } from "./daily-plan-types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function scenarioLabel(t: TFn, type: string | null): string {
  if (!type) return t("prod.shiftReq.current.none");
  return t(`prod.shift.type.${type}`);
}

export function productionDailyPlanToDisplay(plan: ProductionDailyPlan, t: TFn) {
  return {
    todayFocus: t(plan.todayFocus, plan.todayFocusVars),
    doFirst: plan.doFirst.map((k) => t(k)),
    delay: plan.delay.map((k) => t(k)),
    avoid: plan.avoid.map((k) => t(k)),
    bottleneckWatch: plan.bottleneckWatch.map((k) => t(k, plan.todayFocusVars)),
    capacityNotes: plan.capacityNotes.map((k) => t(k, plan.todayFocusVars)),
    reportBackQuestions: plan.reportBackQuestions.map((k) => t(k)),
    confidenceNote: t(plan.confidenceNote),
    activeScenario: scenarioLabel(t, plan.activeScenario),
    requiredScenario: scenarioLabel(t, plan.requiredScenario),
  };
}

export function buildProductionDailyPlanMarkdown(plan: ProductionDailyPlan, t: TFn): string {
  const d = productionDailyPlanToDisplay(plan, t);
  const sections: string[] = [
    `# ${t("prod.plan.export.title")}`,
    "",
    `**${t("prod.plan.field.date")}:** ${new Date(plan.createdAt).toLocaleDateString()}`,
    `**${t("prod.plan.field.state")}:** ${t(`prod.state.${plan.productionState}`)}`,
    `**${t("prod.plan.field.activeShift")}:** ${d.activeScenario}`,
    `**${t("prod.plan.field.requiredShift")}:** ${d.requiredScenario}`,
    "",
    `## ${t("prod.plan.section.focus")}`,
    d.todayFocus,
    "",
    `## ${t("prod.plan.section.doFirst")}`,
    ...d.doFirst.map((x) => `- ${x}`),
    "",
    `## ${t("prod.plan.section.delay")}`,
    ...d.delay.map((x) => `- ${x}`),
    "",
    `## ${t("prod.plan.section.avoid")}`,
    ...d.avoid.map((x) => `- ${x}`),
    "",
    `## ${t("prod.plan.section.bottleneck")}`,
    ...d.bottleneckWatch.map((x) => `- ${x}`),
    "",
  ];
  if (d.capacityNotes.length) {
    sections.push(`## ${t("prod.plan.section.capacity")}`, ...d.capacityNotes.map((x) => `- ${x}`), "");
  }
  sections.push(
    `## ${t("prod.plan.section.reportBack")}`,
    ...d.reportBackQuestions.map((x) => `- ${x}`),
    "",
    `---`,
    d.confidenceNote,
  );
  return sections.join("\n");
}

export function buildProductionDailyPlanPlain(plan: ProductionDailyPlan, t: TFn): string {
  return buildProductionDailyPlanMarkdown(plan, t);
}

export function buildProductionDailyPlanJson(plan: ProductionDailyPlan): string {
  return JSON.stringify(plan, null, 2);
}

export function formatProductionDailyPlanCompactLine(plan: ProductionDailyPlan, t: TFn): string {
  const d = productionDailyPlanToDisplay(plan, t);
  const focus = d.doFirst[0] ?? d.todayFocus;
  const delayBit = d.delay[0];
  if (
    plan.productionState === "overloaded" ||
    plan.productionState === "blocked" ||
    plan.todayFocus === "prod.plan.focus.reduce"
  ) {
    return t("prod.plan.daily.overload", { focus: d.todayFocus });
  }
  if (delayBit) {
    return t("prod.plan.daily.line", { focus, delay: delayBit });
  }
  return t("prod.plan.daily.lineShort", { focus });
}
