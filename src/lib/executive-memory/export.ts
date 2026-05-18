import type { ExecutiveMemorySnapshot } from "./types";

export function executiveMemoryToMarkdown(snap: ExecutiveMemorySnapshot): string {
  const epochs = snap.epochs.slice(-8);
  const lines: string[] = [
    "# Executive Memory · VOKRA OS",
    "",
    snap.executiveSummaryRu,
    "",
    "## Memory sources",
    "- Contour signals: Project Memory generation footprint, cognitive pulses, execution routes, feedback outcomes, Signal Fabric cascades (not merged with the archive).",
    `- Generations counted in contour at last pulse: ${snap.projectMemoryInfluenceCount}`,
    "",
    "## Narrative",
    snap.narrativeStateRu,
    "",
    "## Drift",
    snap.drift.captionRu,
    "",
    "## Epochs (recent)",
    ...epochs.map((e) => `- **${e.kind}** · ${e.startPulse}–${e.endPulse ?? "open"} · ${e.executiveSummaryRu.slice(0, 160)}`),
    "",
    "## Patterns",
    ...snap.patterns.map(
      (p) => `- ${p.labelRu} (×${p.recurrence}, leverage ${(p.historicalLeverage01 * 100).toFixed(0)}%, ${p.weightCategory})`,
    ),
    "",
    "## Canonical memories",
    ...snap.canonicalMemories.map((m) => `- **${m.titleRu}** · ${m.bodyRu.slice(0, 200)}`),
    "",
    "## Strategic scars",
    ...snap.strategicScars.map((s) => `- ${s.labelRu} · severity ${(s.severity01 * 100).toFixed(0)}%`),
    "",
    "## Live cognition hints",
    `- tension bias: ${snap.hints.tensionBias.toFixed(3)}`,
    `- confidence bias: ${snap.hints.confidenceBias.toFixed(3)}`,
    `- stability bias: ${snap.hints.stabilityBias.toFixed(3)}`,
    "",
  ];
  return lines.join("\n");
}

export function executiveMemoryToJson(snap: ExecutiveMemorySnapshot): string {
  return JSON.stringify(snap, null, 2);
}
