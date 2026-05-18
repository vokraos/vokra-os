import type { PressureBand, ProductionState } from "./types";

export function newProductionPressureReportId(): string {
  return `ppr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function scoreToBand(score: number): PressureBand {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 32) return "moderate";
  return "low";
}

export function stateRank(s: ProductionState): number {
  if (s === "blocked") return 5;
  if (s === "overloaded") return 4;
  if (s === "unstable") return 3;
  if (s === "pressured") return 2;
  return 1;
}

export function worstState(states: ProductionState[]): ProductionState {
  return [...states].sort((a, b) => stateRank(b) - stateRank(a))[0] ?? "stable";
}
