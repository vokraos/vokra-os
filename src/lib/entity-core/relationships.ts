/**
 * Normalized relationships — aggregation-first.
 * Phase 7: static topology over marketplace → corridors → …
 * Future: replace with edges from ingestion adapters.
 */

import type { CorridorId, EntityId, MarketplaceEntitySnapshot } from "./types";

export const RELATION_SEO_TO_RECO = "seo_amplification→recommendation_pressure";
export const RELATION_RECO_TO_HERO = "recommendation_pressure→hero_load";
export const RELATION_HERO_TO_PROD = "hero_load→production_stress";
export const RELATION_PROD_TO_FULFILL = "production_stress→fulfillment_instability";
export const RELATION_FULFILL_TO_RANK = "fulfillment_instability→ranking_decay";

export function defaultExecutionGeometryEdges(): readonly { from: EntityId; to: EntityId; relation: string }[] {
  return [
    { from: "node-seo", to: "node-reco", relation: RELATION_SEO_TO_RECO },
    { from: "node-reco", to: "node-hero", relation: RELATION_RECO_TO_HERO },
    { from: "node-hero", to: "node-prod", relation: RELATION_HERO_TO_PROD },
    { from: "node-prod", to: "node-fulfill", relation: RELATION_PROD_TO_FULFILL },
    { from: "node-fulfill", to: "node-rank", relation: RELATION_FULFILL_TO_RANK },
  ] as const;
}

export function corridorIds(snapshot: MarketplaceEntitySnapshot): CorridorId[] {
  return [...snapshot.marketplace.childCorridorIds];
}

export function skusForCorridor(snapshot: MarketplaceEntitySnapshot, corridorId: CorridorId): EntityId[] {
  const out: EntityId[] = [];
  for (const sku of snapshot.skus.values()) {
    if (sku.corridorId === corridorId) out.push(sku.id);
  }
  return out;
}

export function aggregateCorridorPressure(snapshot: MarketplaceEntitySnapshot, corridorId: CorridorId): number {
  const c = snapshot.corridors.get(corridorId);
  if (!c) return 0;
  let sum = c.pressure01;
  let n = 1;
  for (const sid of skusForCorridor(snapshot, corridorId)) {
    const s = snapshot.skus.get(sid);
    if (s) {
      sum += s.pressure01;
      n += 1;
    }
  }
  return sum / n;
}
