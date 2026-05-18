import type { FusionConfidenceLevel } from "./types";

/** Map numeric 0–1 match score to executive fusion band. */
export function fusionLevelFromScore(score01: number): FusionConfidenceLevel {
  if (score01 >= 0.985) return "exact";
  if (score01 >= 0.82) return "high";
  if (score01 >= 0.58) return "medium";
  if (score01 >= 0.28) return "weak";
  return "unresolved";
}

export function levelToNumericBand(level: FusionConfidenceLevel): number {
  switch (level) {
    case "exact":
      return 1;
    case "high":
      return 0.88;
    case "medium":
      return 0.68;
    case "weak":
      return 0.38;
    default:
      return 0.12;
  }
}

export function averageConfidence01(levels: readonly FusionConfidenceLevel[]): number {
  if (levels.length === 0) return 0;
  const s = levels.reduce((a, l) => a + levelToNumericBand(l), 0);
  return s / levels.length;
}
