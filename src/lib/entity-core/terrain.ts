import type { MarketplaceEntitySnapshot, MarketplaceTerrainKind } from "./types";
import { selectCorridorsSortedByPressure } from "./selectors";
import { demoCorridor } from "../cognitive-depth/sku-demo";
import { formatPct01 } from "./snapshot";

export function terrainAwarenessMessageKey(terrain: MarketplaceTerrainKind): string {
  return `depth.entity7.terrain.${terrain}`;
}

export function primaryTerrainAwarenessMicro(
  snapshot: MarketplaceEntitySnapshot,
  seed: number,
): { key: string; vars: Record<string, string> } {
  const c = selectCorridorsSortedByPressure(snapshot)[0];
  if (!c) {
    return {
      key: "depth.entity7.terrain.generic",
      vars: { corridor: demoCorridor(seed) },
    };
  }
  return {
    key: terrainAwarenessMessageKey(c.terrain),
    vars: {
      corridor: demoCorridor(seed + 4),
      pressure: formatPct01(c.pressure01),
    },
  };
}
