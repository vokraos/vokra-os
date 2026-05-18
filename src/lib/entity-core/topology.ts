/**
 * SKU topology — role tags for graph selectors (extends snapshot.skus hierarchy).
 */

import type { EntityId, MarketplaceEntitySnapshot } from "./types";

export function skuTopologyRoles(snapshot: MarketplaceEntitySnapshot): Map<EntityId, string> {
  const m = new Map<EntityId, string>();
  for (const s of snapshot.skus.values()) {
    m.set(s.id, s.hierarchy);
  }
  return m;
}
