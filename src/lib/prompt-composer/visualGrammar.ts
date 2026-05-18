import type { VisualCorridorId } from "../visual-intelligence/types";
import { VISUAL_CORRIDOR_CATALOG } from "../visual-intelligence/corridors";

/** Corridor-specific prompt DNA — influences all downstream layers */
export function corridorPromptFragments(id: VisualCorridorId): readonly string[] {
  const g = VISUAL_CORRIDOR_CATALOG.find((c) => c.id === id);
  if (!g) return ["controlled premium darkness", "marketplace-safe hierarchy"];

  const extra: Record<VisualCorridorId, string[]> = {
    archive_luxury: ["washed black", "cinematic shadows", "restrained aggression", "luxury darkness", "premium editorial realism"],
    quiet_streetwear: ["soft monochrome", "clean silhouettes", "minimal architecture", "calm premium energy"],
    brutal_monochrome: ["hard contrast", "monochrome pressure", "graphic discipline", "no decorative drift"],
    washed_vintage: ["controlled fade", "texture legibility", "hero readable at thumbnail scale"],
    corporate_futurewear: ["monochrome utility", "modern staffwear", "industrial luxury", "operational minimalism"],
    premium_basics: ["material truth", "silhouette-first", "print as restrained accent"],
    dark_editorial: ["high contrast", "fashion-campaign lighting", "cold atmosphere", "editorial realism"],
    cinematic_utility: ["tactical minimalism", "motion-ready framing", "utility silhouette clarity"],
  };

  return [...g.grammarLines, ...extra[id]];
}

export function corridorLayerSentence(id: VisualCorridorId): string {
  return `${corridorPromptFragments(id).join(", ")}.`;
}
