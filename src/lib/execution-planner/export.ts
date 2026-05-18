import type { ExecutionPlanSnapshot } from "./types";
import { EXECUTION_STATE_RU, SYSTEM_OWNER_RU } from "./types";

export function executionPlanToJson(snapshot: ExecutionPlanSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function executionPlanToMarkdown(snapshot: ExecutionPlanSnapshot): string {
  const lines: string[] = [
    `# Планировщик исполнения · VOKRA OS`,
    ``,
    `Пульс контура: #${snapshot.pulseGeneration} · ${new Date(snapshot.generatedAt).toISOString()}`,
    ``,
    `## Синхронизация`,
    ...snapshot.integrationRu.map((x) => `- ${x}`),
    ``,
    `## Последовательность`,
    snapshot.sequencingNoteRu,
    ``,
    `## Очередь запусков`,
    ...snapshot.launchQueue.map((q) => `- **${q.labelRu}** (${q.windowRu}) · срочность: ${q.urgency}`),
    ``,
    `## Ресурсы и перераспределение`,
    ``,
    `| Показатель | % |`,
    `|-------------|---|`,
    `| Production pressure | ${snapshot.resourceAllocation.productionPressure} |`,
    `| Content load | ${snapshot.resourceAllocation.contentLoad} |`,
    `| SEO bandwidth | ${snapshot.resourceAllocation.seoBandwidth} |`,
    `| SKU complexity | ${snapshot.resourceAllocation.skuComplexity} |`,
    `| Launch density | ${snapshot.resourceAllocation.launchDensity} |`,
    `| Overload risk | ${snapshot.resourceAllocation.overloadRisk} |`,
    ``,
    snapshot.resourceAllocation.redistributionRu,
    ``,
    `## Узкие места`,
    ...snapshot.bottlenecks.map((b) => `- **${b.labelRu}** (${b.severity}%) · ${SYSTEM_OWNER_RU[b.relatedSystem]}`),
    ``,
    `## Нагрузка систем`,
    ...snapshot.systemLoads.map((s) => `- ${SYSTEM_OWNER_RU[s.system]}: ${s.load}% — ${s.statusRu}`),
    ``,
    `## Маршрутизация`,
    ...snapshot.routing.map((r) => `- ${SYSTEM_OWNER_RU[r.from]} → ${SYSTEM_OWNER_RU[r.to]} (${r.intensity}%) · ${r.labelRu}`),
    ``,
    `## Ближайшие запуски`,
    ...snapshot.upcomingLaunchesRu.map((x) => `- ${x}`),
    ``,
  ];

  for (const m of snapshot.missions) {
    lines.push(`## Миссия: ${m.objectiveRu}`, "", `**Причина:** ${m.reasonRu}`, `**Срочность:** ${m.urgency}`, `**Влияние:** ${m.expectedImpactRu}`, `**Сложность:** ${m.difficulty}/100`, `**Срок:** ${m.timelineRu}`, `**Риски:** ${m.risksRu}`, `**Успех:** ${m.successRu}`, "");
    if (m.adaptationsRu.length) {
      lines.push("**Адаптации:**", ...m.adaptationsRu.map((a) => `- ${a}`), "");
    }
    for (const st of m.stages) {
      lines.push(`### ${st.index + 1}. ${st.nameRu} · ${EXECUTION_STATE_RU[st.state]}`, "");
      for (const tk of st.tasks) {
        lines.push(
          `- [${SYSTEM_OWNER_RU[tk.owner]}] ${tk.labelRu} · ${EXECUTION_STATE_RU[tk.state]} · усилие ${tk.effortScore} · ${tk.timelineRu} · давление ${tk.pressure}%`,
        );
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
