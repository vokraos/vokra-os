import type { BrandEvolutionSnapshot } from "./types";

export function brandEvolutionToJson(snapshot: BrandEvolutionSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function brandEvolutionToMarkdown(snapshot: BrandEvolutionSnapshot): string {
  const lines: string[] = [
    `# Эволюция бренда · VOKRA OS`,
    ``,
    `Пульс: #${snapshot.pulseGeneration} · ${new Date(snapshot.generatedAt).toISOString()}`,
    ``,
    `## Траектория`,
    snapshot.currentTrajectoryRu,
    ``,
    `## Краткосрок vs долгосрок`,
    ...snapshot.shortVsLongRu.map((x) => `- ${x}`),
    snapshot.dnaVsMarketWarningRu ? `\n**Предупреждение ДНК:** ${snapshot.dnaVsMarketWarningRu}\n` : ``,
    `## 90 / 180 / 365`,
    ...snapshot.futureDirections.map((f) => `### ${f.horizonDays} дней\n${f.headlineRu}\n${f.bulletsRu.map((b) => `- ${b}`).join("\n")}`),
  ];
  return lines.join("\n");
}
