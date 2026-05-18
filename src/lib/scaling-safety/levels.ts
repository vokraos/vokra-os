import type { ScalingSafetyLevel } from "./types";

export function newScalingSafetyReportId(): string {
  return `ssf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function safetyRank(level: ScalingSafetyLevel): number {
  if (level === "blocked") return 5;
  if (level === "unsafe") return 4;
  if (level === "fragile") return 3;
  if (level === "cautious") return 2;
  return 1;
}

export function worstSafety(a: ScalingSafetyLevel, b: ScalingSafetyLevel): ScalingSafetyLevel {
  return safetyRank(a) >= safetyRank(b) ? a : b;
}
