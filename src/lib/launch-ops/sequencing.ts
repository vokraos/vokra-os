import type { LaunchSequenceStep, LaunchWavePlan } from "./types";

export function buildLaunchSequence(
  hero: LaunchWavePlan,
  support: LaunchWavePlan,
  expansion: LaunchWavePlan,
  archive: LaunchWavePlan,
  t: (key: string) => string,
): LaunchSequenceStep[] {
  const mapStatus = (w: LaunchWavePlan): LaunchSequenceStep["status"] => {
    if (w.status === "done") return "done";
    if (w.status === "blocked" || w.status === "hold") return "blocked";
    if (w.status === "ready" || w.status === "in_progress") return w.status === "in_progress" ? "ready" : "ready";
    return "pending";
  };

  return [
    { order: 1, label: t("lops.seq.dna"), waveKind: "gate", status: "ready" },
    { order: 2, label: hero.title, waveKind: "hero", status: mapStatus(hero) },
    { order: 3, label: t("lops.seq.signal"), waveKind: "gate", status: mapStatus(hero) === "done" ? "ready" : "pending" },
    { order: 4, label: support.title, waveKind: "support", status: mapStatus(support) },
    { order: 5, label: expansion.title, waveKind: "expansion", status: mapStatus(expansion) },
    { order: 6, label: archive.title, waveKind: "archive_refresh", status: mapStatus(archive) },
  ];
}
