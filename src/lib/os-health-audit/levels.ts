import type { AuditHealthLevel } from "./types";

export function newOsHealthAuditReportId(): string {
  return `oha-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function healthRank(level: AuditHealthLevel): number {
  if (level === "incomplete") return 5;
  if (level === "fragile") return 4;
  if (level === "weak") return 3;
  if (level === "adequate") return 2;
  return 1;
}

export function worstLevel(levels: AuditHealthLevel[]): AuditHealthLevel {
  if (!levels.length) return "incomplete";
  return [...levels].sort((a, b) => healthRank(b) - healthRank(a))[0]!;
}

export function levelFromScore(score: number): AuditHealthLevel {
  if (score >= 85) return "strong";
  if (score >= 68) return "adequate";
  if (score >= 48) return "weak";
  if (score >= 28) return "fragile";
  return "incomplete";
}
