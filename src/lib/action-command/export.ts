import type { ActionCommand, ActionCommandLayerSnapshot } from "./types";

export function actionCommandsToJson(layer: ActionCommandLayerSnapshot): string {
  return JSON.stringify(layer, null, 2);
}

export function actionCommandsToMarkdown(layer: ActionCommandLayerSnapshot): string {
  const lines: string[] = [
    `# Командный слой · VOKRA OS`,
    ``,
    `Пульс: #${layer.pulseGeneration} · ${new Date(layer.generatedAt).toISOString()}`,
    ``,
  ];
  const top = layer.commands.find((c) => c.id === layer.topCommandId);
  if (top) {
    lines.push(`## Сейчас: приоритет`, `**${top.titleRu}**`, `Тип: ${top.typeLabelRu} · ${top.statusLabelRu} · priority ${top.priority}`, `Шаг: ${top.firstStepRu}`, `Риск игнора: ${top.riskIfIgnoredRu}`, ``);
  }
  lines.push(`## Очередь (${layer.commands.length})`, ``);
  for (const c of layer.commands) {
    lines.push(
      `### ${c.titleRu}`,
      `- **Тип:** ${c.typeLabelRu} · **Владелец:** ${c.owner} · **Статус:** ${c.statusLabelRu} · **P:** ${c.priority}`,
      `- **Почему:** ${c.reasonRu}`,
      `- **Шаг:** ${c.firstStepRu}`,
      `- **Эффект:** ${c.expectedOutcomeRu}`,
      `- **Окно:** ${c.deadlineWindowRu}`,
      `- **Зависимости:** ${c.dependenciesRu.join(" · ")}`,
      `- **Риск игнора:** ${c.riskIfIgnoredRu}`,
      `- **Маршрут:** \`${c.linkedRouteId}\` · стадия ${c.linkedStageIndex}`,
      ``,
    );
  }
  return lines.join("\n");
}

export function actionCommandsTopBlock(commands: readonly ActionCommand[], topId: string | null): string {
  const top = topId ? commands.find((c) => c.id === topId) : commands[0];
  if (!top) return "";
  return [`### Топ-команда`, `1. **${top.titleRu}** (${top.typeLabelRu}) — ${top.statusLabelRu}`, `   ${top.firstStepRu}`, ``].join("\n");
}
