import type { SerpDerivedAnalysis } from "../competitor-serp/types";
import { aggregateSerpArchetypes, dominantArchetypes } from "../hero-archetypes/classify";
import type { ArchetypeShare } from "../hero-archetypes/types";
import type { CompetitorSerpItem } from "../competitor-serp/types";

export function archetypeSaturationPressure(shares: readonly ArchetypeShare[]): number {
  const dom = dominantArchetypes(shares, 5);
  const top = dom[0]?.sharePct ?? 0;
  const second = dom[1]?.sharePct ?? 0;
  return Math.round(Math.min(100, top * 0.65 + second * 0.25));
}

export function combinedSaturationFatigue(analysis: SerpDerivedAnalysis, archPressure: number): number {
  const raw = analysis.saturationSignal * 0.55 + archPressure * 0.35 + (analysis.dominantVisualPatterns[0]?.sharePct ?? 0) * 0.1;
  return Math.round(Math.min(100, raw));
}

export function buildArchetypeSharesForFatigue(items: readonly CompetitorSerpItem[]): ArchetypeShare[] {
  return aggregateSerpArchetypes(items);
}
