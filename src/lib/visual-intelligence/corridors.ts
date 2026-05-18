import type { VisualCorridorGrammar, VisualCorridorId } from "./types";

export const VISUAL_CORRIDOR_CATALOG: readonly VisualCorridorGrammar[] = [
  {
    id: "archive_luxury",
    labelRu: "Archive luxury",
    labelEn: "Archive luxury",
    grammarLines: ["washed black", "premium darkness", "soft brutal typography", "cinematic shadows"],
  },
  {
    id: "quiet_streetwear",
    labelRu: "Quiet streetwear",
    labelEn: "Quiet streetwear",
    grammarLines: ["clean silhouettes", "minimal environment", "restrained branding", "low noise thumbnails"],
  },
  {
    id: "brutal_monochrome",
    labelRu: "Brutal monochrome",
    labelEn: "Brutal monochrome",
    grammarLines: ["hard contrast", "single-axis palette", "pressure typography", "no decorative drift"],
  },
  {
    id: "washed_vintage",
    labelRu: "Washed vintage",
    labelEn: "Washed vintage",
    grammarLines: ["controlled fade", "texture legibility", "hero still readable at WB scale"],
  },
  {
    id: "corporate_futurewear",
    labelRu: "Corporate futurewear",
    labelEn: "Corporate futurewear",
    grammarLines: ["monochrome utility", "modern uniform logic", "futuristic staffwear", "grid discipline"],
  },
  {
    id: "premium_basics",
    labelRu: "Premium basics",
    labelEn: "Premium basics",
    grammarLines: ["material truth", "silhouette first", "print as accent not noise"],
  },
  {
    id: "dark_editorial",
    labelRu: "Dark editorial",
    labelEn: "Dark editorial",
    grammarLines: ["high contrast", "fashion-campaign lighting", "cold atmosphere", "editorial realism"],
  },
  {
    id: "cinematic_utility",
    labelRu: "Cinematic utility",
    labelEn: "Cinematic utility",
    grammarLines: ["tactical minimalism", "motion-ready framing", "utility silhouette clarity"],
  },
] as const;

const ORDER: VisualCorridorId[] = VISUAL_CORRIDOR_CATALOG.map((c) => c.id);

export function corridorByIndex(i: number): VisualCorridorGrammar {
  return VISUAL_CORRIDOR_CATALOG[((i % ORDER.length) + ORDER.length) % ORDER.length]!;
}

/** Map marketplace `corridor-N` index (0-based) to visual corridor grammar */
export function visualCorridorFromMarketplaceCorridorId(corridorId: string, seed: number): VisualCorridorGrammar {
  const m = /^corridor-(\d+)$/.exec(corridorId);
  const idx = m ? Number(m[1]) - 1 : 0;
  const salt = (seed % 3) + (idx % 2);
  return corridorByIndex(idx + salt);
}
