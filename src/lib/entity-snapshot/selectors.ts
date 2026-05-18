import type { EntitySnapshot, SkuEntityRow, CardEntityRow } from "./types";
import { loadActiveEntitySnapshot } from "./storage";
import {
  deriveSnapshotIntelligence,
  mopsBlockedGroupsFromIntel,
  mopsLaunchCandidatesByCorridor,
  type SnapshotIntelligence,
  type MopsBlockedGroup,
  type SnapshotActionItem,
} from "./intelligence";

export function hasActiveEntitySnapshot(): boolean {
  return loadActiveEntitySnapshot() != null;
}

export function getActiveEntitySnapshot(): EntitySnapshot | null {
  return loadActiveEntitySnapshot();
}

export type SkuIntelSnapshotPanel = {
  snapshot: EntitySnapshot;
  intelligence: SnapshotIntelligence;
  skuCount: number;
  corridorGroups: { corridor: string; count: number }[];
  topSample: SkuEntityRow | null;
  weakSamples: SkuEntityRow[];
  marketplaceCounts: Record<string, number>;
  stockModeCounts: Record<string, number>;
  productFamilies: string[];
  seoClusters: string[];
};

function sortCorridorGroups(skus: SkuEntityRow[]): { corridor: string; count: number }[] {
  const m = new Map<string, number>();
  for (const s of skus) {
    const c = s.corridor.trim() || "—";
    m.set(c, (m.get(c) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([corridor, count]) => ({ corridor, count }))
    .sort((a, b) => b.count - a.count || a.corridor.localeCompare(b.corridor));
}

export function selectSkuIntelImportPanel(): SkuIntelSnapshotPanel | null {
  const snapshot = loadActiveEntitySnapshot();
  if (!snapshot) return null;
  const intelligence = deriveSnapshotIntelligence(snapshot);
  const skus = snapshot.skuEntities;
  const weakSamples = [...skus]
    .filter((s) => s.completeness !== "strong")
    .sort((a, b) => a.completeness.localeCompare(b.completeness))
    .slice(0, 8);
  const topSample =
    [...skus].sort((a, b) => {
      const ord = (x: SkuEntityRow) => (x.completeness === "strong" ? 0 : x.completeness === "weak" ? 1 : 2);
      return ord(a) - ord(b) || a.skuCode.localeCompare(b.skuCode);
    })[0] ?? null;
  return {
    snapshot,
    intelligence,
    skuCount: skus.length,
    corridorGroups: sortCorridorGroups(skus),
    topSample,
    weakSamples,
    marketplaceCounts: { ...snapshot.marketplaceCounts },
    stockModeCounts: { ...snapshot.stockModeCounts },
    productFamilies: [...snapshot.productFamilies],
    seoClusters: [...snapshot.seoClusters],
  };
}

export type MopsSnapshotPanel = {
  snapshot: EntitySnapshot;
  intelligence: SnapshotIntelligence;
  cardCount: number;
  marketplaceSplit: Record<string, number>;
  corridors: string[];
  launchCandidates: CardEntityRow[];
  missingFieldSummary: { hero: number; seo: number; warehouse: number };
  launchByCorridor: { corridor: string; count: number }[];
  blockedGroups: MopsBlockedGroup[];
  recommendedAction: SnapshotActionItem | null;
};

export function selectMarketplaceOpsImportPanel(): MopsSnapshotPanel | null {
  const snapshot = loadActiveEntitySnapshot();
  if (!snapshot) return null;
  const intelligence = deriveSnapshotIntelligence(snapshot);
  const cards = snapshot.cardEntities;
  let hero = 0;
  let seo = 0;
  let wh = 0;
  for (const c of cards) {
    if (c.missingHero) hero++;
    if (c.missingSeo) seo++;
    if (c.missingWarehouse) wh++;
  }
  const launchCandidates = [...cards]
    .filter((c) => Boolean(c.cardTitle && c.cardTitle !== "—"))
    .slice(0, 12);
  return {
    snapshot,
    intelligence,
    cardCount: cards.length,
    marketplaceSplit: { ...snapshot.marketplaceCounts },
    corridors: [...snapshot.corridors],
    launchCandidates,
    missingFieldSummary: { hero: hero, seo, warehouse: wh },
    launchByCorridor: mopsLaunchCandidatesByCorridor(intelligence),
    blockedGroups: mopsBlockedGroupsFromIntel(intelligence),
    recommendedAction: intelligence.actionQueue[0] ?? null,
  };
}

export type EntitySnapshotBannerCounts = {
  sku: number;
  cards: number;
  corridors: number;
};

export function selectEntitySnapshotBannerCounts(): EntitySnapshotBannerCounts | null {
  const s = loadActiveEntitySnapshot();
  if (!s) return null;
  return {
    sku: s.skuEntities.length,
    cards: s.cardEntities.length,
    corridors: s.corridors.length,
  };
}
