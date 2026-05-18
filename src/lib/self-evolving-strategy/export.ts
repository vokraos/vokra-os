import type { SelfEvolvingSnapshot } from "./types";

export function selfEvolvingToMarkdown(snap: SelfEvolvingSnapshot): string {
  const lines: string[] = [
    "# Strategy Evolution · VOKRA OS",
    "",
    snap.summaryRu,
    "",
    "## Adaptive weights (multipliers)",
    ...Object.entries(snap.weights).map(([k, v]) => `- **${k}**: ${typeof v === "number" ? v.toFixed(3) : v}`),
    "",
    "## Learning loops",
    ...snap.loops.map((l) => `- **${l.id}** · rec ${l.recurrence} · conf ${(l.confidence01 * 100).toFixed(0)}% · ${l.labelRu}`),
    "",
    "## Trajectory (last)",
    ...(snap.trajectory.length
      ? [
          `- pulse ${snap.trajectory[snap.trajectory.length - 1]!.pulse}: maturity ${(snap.maturity01 * 100).toFixed(0)}%`,
        ]
      : ["- (empty)"]),
    "",
  ];
  return lines.join("\n");
}

export function selfEvolvingToJson(snap: SelfEvolvingSnapshot): string {
  return JSON.stringify(snap, null, 2);
}
