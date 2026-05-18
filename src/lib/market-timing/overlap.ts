import type { LaunchWaveOperationalEntity } from "../marketplace-operations/types";

export function computeOverlapPressure(waves: LaunchWaveOperationalEntity[]): number {
  const active = waves.filter((w) => !["archived", "paused"].includes(w.launchStatus));
  if (active.length <= 1) return active.length === 1 ? 12 : 0;
  const hot = active.filter((w) => ["assembling", "ready", "planning", "launched"].includes(w.launchStatus));
  if (hot.length >= 3) return Math.min(100, 55 + hot.length * 14);
  if (hot.length === 2) {
    const statuses = new Set(hot.map((w) => w.launchStatus));
    if (statuses.size > 1 || hot.some((w) => w.operationalPressure >= 60)) return 58;
    return 42;
  }
  return 24;
}

export function hasOverlappingLaunches(waves: LaunchWaveOperationalEntity[]): boolean {
  const hot = waves.filter((w) => ["assembling", "ready", "launched"].includes(w.launchStatus));
  return hot.length >= 2;
}
