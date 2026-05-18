export function newCorridorStrategyReportId(corridor: string): string {
  const slug = corridor.replace(/\s+/g, "-").slice(0, 24) || "corridor";
  return `cst-${slug}-${Date.now().toString(36)}`;
}

export function scoreLevel(score: number): "low" | "moderate" | "elevated" | "high" {
  if (score < 30) return "low";
  if (score < 55) return "moderate";
  if (score < 75) return "elevated";
  return "high";
}
