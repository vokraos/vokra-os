import type { FeedbackLoopSnapshot } from "./types";
import { FEEDBACK_EVENT_KIND_RU } from "./types";

export function feedbackLoopToJson(snapshot: FeedbackLoopSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function feedbackLoopToMarkdown(snapshot: FeedbackLoopSnapshot): string {
  const lines: string[] = [
    `# Контур обратной связи · VOKRA OS`,
    ``,
    `Пульс: #${snapshot.pulseGeneration} · ${new Date(snapshot.generatedAt).toISOString()}`,
    ``,
    `## Последние результаты`,
    ...snapshot.recentResults.map((r) => `- **${r.labelRu}** (${r.skuOrScopeRu}) · ${r.metric}: ${r.outcomeRu}`),
    ``,
    `## События обратной связи`,
    ...snapshot.events.map(
      (e) =>
        `- **${FEEDBACK_EVENT_KIND_RU[e.kind]}** · ${e.metric}: ${e.beforeValue} → ${e.afterValue} · Δconfidence ${e.confidenceAdjustment} · ${e.interpretationRu}`,
    ),
    ``,
    `## Память исходов`,
    snapshot.outcomeMemory.summaryRu,
    ...snapshot.outcomeMemory.echoesRu.map((x) => `> ${x}`),
    ``,
  ];
  return lines.join("\n");
}
