import type { SerpDerivedAnalysis } from "../competitor-serp/types";

export function focalCompetitionScore(analysis: SerpDerivedAnalysis, itemCount: number): number {
  if (itemCount < 1) return 0;
  const patternC = analysis.dominantVisualPatterns[0]?.sharePct ?? 0;
  const sat = analysis.saturationSignal;
  const modelPressure = analysis.modelUsageVars?.pct ? Number(analysis.modelUsageVars.pct) : 0;
  const raw = patternC * 0.45 + sat * 0.35 + modelPressure * 0.2;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

/** Higher = more pressure to win thumbnail clarity vs the pasted corridor. */
export function readabilityPressureIndex(args: {
  fieldAvgReadability: number;
  saturationSignal: number;
  overloadSharePct: number;
  focalCompetition: number;
}): number {
  const inv = 100 - args.fieldAvgReadability;
  const raw = inv * 0.38 + args.saturationSignal * 0.22 + args.overloadSharePct * 0.22 + args.focalCompetition * 0.18;
  return Math.round(Math.max(0, Math.min(100, raw)));
}
