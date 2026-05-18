import type { ExecutionOrchestrationSnapshot } from "./types";
import { ROUTE_STATE_RU, ROUTE_KIND_LABEL_RU, SYSTEM_LABEL_RU } from "./types";

export function orchestrationToJson(snapshot: ExecutionOrchestrationSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function orchestrationToMarkdown(snapshot: ExecutionOrchestrationSnapshot): string {
  const lines: string[] = [
    `# Оркестратор исполнения · VOKRA OS`,
    ``,
    `Пульс: #${snapshot.pulseGeneration} · ${new Date(snapshot.generatedAt).toISOString()}`,
    ``,
    `## Уверенность исполнения`,
    `${snapshot.executionConfidence}% · операционный drag ${snapshot.operationalDrag}%`,
    ``,
    `## Следующий лучший шаг`,
    snapshot.nextBestActionRu,
    ``,
    `## Интеграция`,
    ...snapshot.integrationRu.map((x) => `- ${x}`),
    ``,
    `## Ресурсное давление`,
    `| Показатель | % |`,
    `|-------------|---|`,
    `| DTF queue | ${snapshot.resourcePressure.dtfQueue} |`,
    `| Packaging | ${snapshot.resourcePressure.packagingBottleneck} |`,
    `| Content | ${snapshot.resourcePressure.contentLoad} |`,
    `| SKU | ${snapshot.resourcePressure.skuComplexity} |`,
    `| SEO bandwidth | ${snapshot.resourcePressure.seoBandwidth} |`,
    `| Campaign | ${snapshot.resourcePressure.campaignPressure} |`,
    `| FBO readiness | ${snapshot.resourcePressure.fboReadiness} |`,
    ``,
    snapshot.resourcePressure.summaryRu,
    ``,
    `## Блокеры`,
    ...snapshot.blockers.map((b) => `- **${b.labelRu}** (${b.severity}%)`),
    ``,
    `## Граф зависимостей`,
    snapshot.dependencyGraph.summaryRu,
    ...snapshot.dependencyGraph.edges.map((e) => `- ${e.fromRu} → ${e.toRu}: ${e.conditionRu}`),
    ``,
    `## Командный слой`,
    `Команд: ${snapshot.actionCommandLayer.commands.length} · топ: \`${snapshot.actionCommandLayer.topCommandId ?? "—"}\``,
    ...snapshot.actionCommandLayer.commands.slice(0, 14).map((c) => `- **${c.titleRu}** · ${c.typeLabelRu} · ${c.statusLabelRu} · P${c.priority} · ${c.riskIfIgnoredRu}`),
    ``,
    `## Системы`,
    ...snapshot.systemsInvolvedRu.map((x) => `- ${x}`),
    ``,
  ];

  for (const r of snapshot.routes) {
    lines.push(`## Маршрут: ${r.titleRu} (${ROUTE_KIND_LABEL_RU[r.kind]})`, "");
    lines.push(`**Состояние:** ${ROUTE_STATE_RU[r.routeState]} · **Срочность:** ${r.urgency} · **Confidence:** ${r.confidence}%`);
    lines.push(`**Цель:** ${r.objectiveRu}`, `**Причина:** ${r.reasonRu}`, `**Эффект:** ${r.expectedImpactRu}`, `**Риски:** ${r.risksRu}`, `**Блокеры:** ${r.blockersRu.join("; ") || "—"}`, `**Далее:** ${r.nextActionRu}`, "");
    lines.push(`### Последовательность`, "");
    for (const st of r.sequence.stages) {
      lines.push(`#### ${st.index + 1}. ${st.nameRu} · ${ROUTE_STATE_RU[st.status]} · ${SYSTEM_LABEL_RU[st.owner]}`);
      lines.push(`Зависимость: ${st.dependencyRu}`, `Усилие ${st.estimatedEffort}% · давление ${st.pressure}% · confidence ${st.confidence}%`, "");
    }
  }

  return lines.join("\n");
}
