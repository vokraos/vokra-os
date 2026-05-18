import type { FboDecisionConfidence, FboDecisionReadiness, FboFitLevel } from "./types";

export function newFboFbsDecisionReportId(): string {
  return `ffd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function fitRank(level: FboFitLevel): number {
  if (level === "blocked") return 0;
  if (level === "fragile") return 1;
  if (level === "fair") return 2;
  if (level === "good") return 3;
  return 4;
}

export function readinessRank(level: FboDecisionReadiness): number {
  if (level === "blocked") return 0;
  if (level === "fragile") return 1;
  if (level === "test_ready") return 2;
  if (level === "ready") return 3;
  return 4;
}

export function fitFromScore(score: number): FboFitLevel {
  if (score < 20) return "blocked";
  if (score < 40) return "fragile";
  if (score < 58) return "fair";
  if (score < 78) return "good";
  return "strong";
}

export function readinessFromScore(score: number): FboDecisionReadiness {
  if (score < 22) return "blocked";
  if (score < 42) return "fragile";
  if (score < 62) return "test_ready";
  if (score < 82) return "ready";
  return "expansion_ready";
}

export function confidenceFromReadiness(
  readiness: FboDecisionReadiness,
  hasSnapshot: boolean,
): FboDecisionConfidence {
  if (!hasSnapshot || readiness === "blocked") return "low";
  if (readiness === "fragile" || readiness === "test_ready") return "moderate";
  return "high";
}
