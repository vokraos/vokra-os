import type { CampaignVisualEntity, HeroVisualEntity } from "./types";

export function buildCampaignVisualEntity(
  seed: number,
  hero: HeroVisualEntity,
  collectionReels: string,
  collectionThumb: string,
  collectionBg: string,
): CampaignVisualEntity {
  const support = [`sup-vis-${seed}-a`, `sup-vis-${seed}-b`, `sup-vis-${seed}-c`] as const;
  return {
    id: `camp-vis-${seed}`,
    heroVisualId: hero.id,
    supportVisualIds: [...support],
    reelsDirection: collectionReels || "Tight beats, silhouette-first cuts, no decorative B-roll.",
    thumbnailLogic:
      collectionThumb ||
      "Single hero plane, print legible at 64px, corridor color axis consistent with DNA darkness.",
    backgroundStyle: collectionBg || "Low-complexity field; depth via shadow not props.",
    castingLogic: "Restrained aggression faces; no stock-smile retail casting.",
    visualPacing: "Hero lock → support density → reels acceleration → marketplace card refresh window.",
  };
}
