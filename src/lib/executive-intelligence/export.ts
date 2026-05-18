import type { ExecutiveSnapshot } from "./types";
import { EXECUTIVE_REGIME_RU } from "./types";

export function executiveIntelligenceToJson(snapshot: ExecutiveSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function executiveIntelligenceToMarkdown(snapshot: ExecutiveSnapshot): string {
  const lines: string[] = [
    `# Executive Intelligence · VOKRA OS`,
    ``,
    `Пульс #${snapshot.pulseGeneration} · ${new Date(snapshot.generatedAt).toISOString()}`,
    ``,
    `## Режим`,
    `${EXECUTIVE_REGIME_RU[snapshot.regime]} — ${snapshot.regimeExplanationRu}`,
    ``,
    `## Стратегические противоречия`,
    ...snapshot.strategicContradictions.map((c) => `- **${c.summaryRu}** (${c.severity}%): ${c.tensionRu}`),
    ``,
    `## Директивы`,
    ...snapshot.directives.map((d) => `1. ${d.directiveRu}\n   _${d.rationaleRu}_`),
    ``,
    `## Стабильность`,
    `${snapshot.stabilityIndex}% — ${snapshot.stabilityCaptionRu}`,
    ``,
  ];
  return lines.join("\n");
}
