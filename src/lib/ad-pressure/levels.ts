import type { AdPressureLevel } from "./types";

export function levelFromScore(score: number): AdPressureLevel {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s < 25) return "low";
  if (s < 45) return "manageable";
  if (s < 65) return "elevated";
  if (s < 80) return "dangerous";
  return "critical";
}

export function levelRank(level: AdPressureLevel): number {
  if (level === "critical") return 5;
  if (level === "dangerous") return 4;
  if (level === "elevated") return 3;
  if (level === "manageable") return 2;
  return 1;
}

export function worstLevel(levels: AdPressureLevel[]): AdPressureLevel {
  return [...levels].sort((a, b) => levelRank(b) - levelRank(a))[0] ?? "low";
}

export function newAdvertisingPressureReportId(): string {
  return `adp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
