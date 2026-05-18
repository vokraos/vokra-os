import { demoCorridor, demoSkuId } from "../cognitive-depth/sku-demo";
import type { MarketplaceEntitySnapshot } from "./types";

export type HeroSpotlight = { key: string; vars: Record<string, string> };

export function heroHierarchySpotlight(snapshot: MarketplaceEntitySnapshot, seed: number): HeroSpotlight | null {
  const heroes = [...snapshot.heroes.values()];
  const h = heroes[0];
  if (!h) return null;
  const sku = snapshot.skus.get(h.skuId);
  const corridor = snapshot.corridors.get(h.corridorId);
  return {
    key: `depth.entity7.hero.${h.hierarchy}`,
    vars: {
      sku: sku?.wbStyleId ?? demoSkuId(seed),
      corridor: corridor ? demoCorridor(seed + 3) : demoCorridor(seed),
    },
  };
}
