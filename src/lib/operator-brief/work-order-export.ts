import type { OperatorWorkOrder, OperatorWorkOrderLine } from "./types";

type TFn = (key: string, vars?: Record<string, string>) => string;

function linesSection(title: string, items: OperatorWorkOrderLine[], empty: string): string[] {
  const out = [`## ${title}`, ""];
  if (!items.length) {
    out.push(empty, "");
    return out;
  }
  for (const item of items) {
    out.push(`- ${item.label}`);
    if (item.detail?.trim()) out.push(`  ${item.detail.trim()}`);
  }
  out.push("");
  return out;
}

function listSection(title: string, items: string[]): string[] {
  const out = [`## ${title}`, ""];
  for (const item of items) out.push(`- ${item}`);
  out.push("");
  return out;
}

export function buildOperatorWorkOrderMarkdown(order: OperatorWorkOrder, t: TFn): string {
  const lines: string[] = [
    `# ${t("opm.wo.title")}`,
    "",
    `**${order.dateLabel}**`,
    "",
  ];

  if (
    order.warRoomTeamInstructions.length ||
    order.warRoomWatchList.length ||
    order.warRoomBlockedItems.length
  ) {
    lines.push(`## ${t("opm.warRoom.section.title")}`, "", t("opm.warRoom.lede"), "");
    lines.push(
      ...linesSection(t("opm.warRoom.team"), order.warRoomTeamInstructions, t("opm.wo.empty.section")),
      ...listSection(t("opm.warRoom.watch"), order.warRoomWatchList),
      ...linesSection(t("opm.warRoom.blocked"), order.warRoomBlockedItems, t("opm.wo.empty.blocked")),
    );
  }

  lines.push(
    ...linesSection(t("opm.plan.section.doFirst"), order.productionDoFirst, t("opm.wo.empty.section")),
    ...linesSection(t("opm.plan.section.delay"), order.productionDelay, t("opm.wo.empty.section")),
    ...linesSection(t("opm.plan.section.avoid"), order.productionAvoid, t("opm.wo.empty.section")),
    ...listSection(t("opm.plan.section.bottleneck"), order.productionBottleneckWatch),
    ...linesSection(t("opm.wo.section.priority"), order.priorityTasks, t("opm.wo.empty.section")),
    ...linesSection(t("opm.wo.section.visual"), order.visualTasks, t("opm.wo.empty.section")),
    ...linesSection(t("opm.wo.section.card"), order.cardTasks, t("opm.wo.empty.section")),
    ...linesSection(t("opm.wo.section.launch"), order.launchTasks, t("opm.wo.empty.section")),
    ...linesSection(t("opm.wo.section.data"), order.dataTasks, t("opm.wo.empty.section")),
    ...linesSection(t("opm.wo.section.blocked"), order.blockedItems, t("opm.wo.empty.blocked")),
    ...listSection(t("opm.wo.section.check"), order.checkBeforeFinish),
    ...listSection(t("opm.wo.section.report"), order.reportBackQuestions),
  );

  if (order.notes) {
    lines.push(`## ${t("opm.wo.section.notes")}`, "", order.notes, "");
  }

  return lines.join("\n").trimEnd();
}

export function buildOperatorWorkOrderPlain(order: OperatorWorkOrder, t: TFn): string {
  return buildOperatorWorkOrderMarkdown(order, t)
    .replace(/\*\*/g, "")
    .replace(/^#+ /gm, "");
}
