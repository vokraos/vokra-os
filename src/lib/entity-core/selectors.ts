/**
 * Scalable selectors over aggregate-first snapshot (O(corridors + skus)).
 */

import type { CorridorEntity, CorridorId, EntityId, MarketplaceEntitySnapshot } from "./types";
import { aggregateCorridorPressure, skusForCorridor } from "./relationships";

export function selectCorridor(snapshot: MarketplaceEntitySnapshot, id: CorridorId): CorridorEntity | undefined {
  return snapshot.corridors.get(id);
}

export function selectCorridorsSortedByPressure(snapshot: MarketplaceEntitySnapshot): CorridorEntity[] {
  return [...snapshot.corridors.values()].sort(
    (a, b) => aggregateCorridorPressure(snapshot, b.id) - aggregateCorridorPressure(snapshot, a.id),
  );
}

export function selectTopOverloadCorridor(snapshot: MarketplaceEntitySnapshot): CorridorEntity | undefined {
  return selectCorridorsSortedByPressure(snapshot)[0];
}

export function selectHeroSkus(
  snapshot: MarketplaceEntitySnapshot,
): { skuId: EntityId; corridorId: CorridorId; wbStyleId: string }[] {
  const out: { skuId: EntityId; corridorId: CorridorId; wbStyleId: string }[] = [];
  for (const s of snapshot.skus.values()) {
    if (s.hierarchy === "hero" || s.hierarchy === "anchor") {
      out.push({ skuId: s.id, corridorId: s.corridorId, wbStyleId: s.wbStyleId });
    }
  }
  return out;
}

export function groupSkuIdsByLaunchWave(snapshot: MarketplaceEntitySnapshot): Map<EntityId, EntityId[]> {
  const m = new Map<EntityId, EntityId[]>();
  for (const w of snapshot.launchWaves.values()) {
    const skuIds: EntityId[] = [];
    for (const cid of w.linkedCorridorIds) {
      skuIds.push(...skusForCorridor(snapshot, cid));
    }
    m.set(w.id, skuIds);
  }
  return m;
}
