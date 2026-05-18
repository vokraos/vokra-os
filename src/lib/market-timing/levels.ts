import type { CadenceLevel, TimingState } from "./types";

export function newMarketTimingReportId(corridor: string): string {
  const slug = corridor.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 32) || "default";
  return `mtm-${slug}-${Date.now().toString(36)}`;
}

export function scoreLevel(score: number): "low" | "moderate" | "elevated" | "high" {
  if (score >= 72) return "high";
  if (score >= 52) return "elevated";
  if (score >= 32) return "moderate";
  return "low";
}

export function cadenceFromPressure(score: number): CadenceLevel {
  if (score >= 82) return "chaotic";
  if (score >= 65) return "overloaded";
  if (score >= 48) return "accelerated";
  if (score >= 28) return "stable";
  return "slow";
}

export function cadenceRank(level: CadenceLevel): number {
  if (level === "chaotic") return 5;
  if (level === "overloaded") return 4;
  if (level === "accelerated") return 3;
  if (level === "stable") return 2;
  return 1;
}

export function timingStateRank(state: TimingState): number {
  if (state === "unstable") return 6;
  if (state === "burnout_risk") return 5;
  if (state === "overlapping") return 4;
  if (state === "crowded") return 3;
  if (state === "refresh_due") return 2;
  return 1;
}
