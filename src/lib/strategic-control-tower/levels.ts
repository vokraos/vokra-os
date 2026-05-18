import type { ControlTowerOverallState, SystemHealthLevel } from "./types";

export function newControlTowerSnapshotId(): string {
  return `sct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function healthRank(h: SystemHealthLevel): number {
  if (h === "blocked") return 5;
  if (h === "pressured") return 4;
  if (h === "watch") return 3;
  if (h === "ready") return 2;
  return 1;
}

export function overallRank(s: ControlTowerOverallState): number {
  if (s === "blocked") return 5;
  if (s === "fragile") return 4;
  if (s === "pressured") return 3;
  if (s === "expansion_ready") return 2;
  return 1;
}
