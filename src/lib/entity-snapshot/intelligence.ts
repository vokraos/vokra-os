import type { NavId } from "../../types";
import type { CardEntityRow, EntitySnapshot, SkuEntityRow } from "./types";

export type CorridorSummaryRow = {
  corridor: string;
  skuCount: number;
  cardCount: number;
  total: number;
};

export type MarketplaceSummaryRow = {
  marketplace: string;
  skuCount: number;
  cardCount: number;
};

export type StockModeSummaryRow = {
  mode: string;
  count: number;
  fboLike: boolean;
  fbsLike: boolean;
};

export type SeoGapSummary = {
  cardsMissingSeo: number;
  skusInCorridorsWithoutSeoSignal: number;
  topGapCorridor: string | null;
};

export type MissingFieldSummary = {
  skuMissingCorridor: number;
  skuMissingTitle: number;
  skuMissingWarehouse: number;
  skuMissingStockMode: number;
  skuMissingProductFamily: number;
  cardMissingHero: number;
  cardMissingSeo: number;
  cardMissingWarehouse: number;
  /** Sum of distinct “slots” to fix (heuristic, for memory / banners). */
  totalSlots: number;
};

export type LaunchCandidateSummary = {
  eligibleCount: number;
  byCorridor: { corridor: string; count: number }[];
};

export type RefreshCandidateSummary = {
  weakSkuCount: number;
  thinTitleCardCount: number;
  /** SKU codes for compact display */
  sampleSkuCodes: string[];
};

export type FboExposureSummary = {
  fboLikeRows: number;
  fbsLikeRows: number;
  ambiguousOrEmpty: number;
  mixedCorridors: { corridor: string; hasFbo: boolean; hasFbs: boolean }[];
};

export type SnapshotActionPriority = "critical" | "high" | "medium" | "low";

export type SnapshotActionItem = {
  id: string;
  titleKey: string;
  reasonKey: string;
  affectedCount: number;
  priority: SnapshotActionPriority;
  /** Higher sorts first */
  sortScore: number;
  corridor?: string;
  marketplace?: string;
  destination: NavId;
  vars: Record<string, string>;
};

export type SnapshotIntelligence = {
  corridorSummary: CorridorSummaryRow[];
  marketplaceSummary: MarketplaceSummaryRow[];
  stockModeSummary: StockModeSummaryRow[];
  seoGapSummary: SeoGapSummary;
  missingFieldSummary: MissingFieldSummary;
  launchCandidateSummary: LaunchCandidateSummary;
  refreshCandidateSummary: RefreshCandidateSummary;
  fboExposureSummary: FboExposureSummary;
  actionQueue: SnapshotActionItem[];
  /** Hero-oriented SKU codes in the largest corridor (by total rows). */
  heroCandidateSkus: { skuCode: string; corridor: string; completeness: string }[];
  suggestedNextStepKey: string;
};

function ckey(s: string): string {
  return s.trim() || "—";
}

function normStock(s: string): string {
  return s.trim() || "—";
}

function stockFlags(mode: string): { fboLike: boolean; fbsLike: boolean } {
  const m = mode.toLowerCase();
  return {
    fboLike: /\bfbo\b|fbo|фбо/.test(m),
    fbsLike: /\bfbs\b|fbs|фбс|dropship|кроссдок/.test(m),
  };
}

function priorityScore(p: SnapshotActionPriority): number {
  if (p === "critical") return 100;
  if (p === "high") return 75;
  if (p === "medium") return 50;
  return 25;
}

function countMissing(skus: SkuEntityRow[], field: string): number {
  return skus.filter((s) => s.missingFields.includes(field)).length;
}

function buildCorridorSummary(skus: SkuEntityRow[], cards: CardEntityRow[]): CorridorSummaryRow[] {
  const m = new Map<string, { sku: number; card: number }>();
  for (const s of skus) {
    const k = ckey(s.corridor);
    const cur = m.get(k) ?? { sku: 0, card: 0 };
    cur.sku += 1;
    m.set(k, cur);
  }
  for (const c of cards) {
    const k = ckey(c.corridor);
    const cur = m.get(k) ?? { sku: 0, card: 0 };
    cur.card += 1;
    m.set(k, cur);
  }
  return [...m.entries()]
    .map(([corridor, v]) => ({
      corridor,
      skuCount: v.sku,
      cardCount: v.card,
      total: v.sku + v.card,
    }))
    .sort((a, b) => b.total - a.total || a.corridor.localeCompare(b.corridor));
}

function buildMarketplaceSummary(skus: SkuEntityRow[], cards: CardEntityRow[]): MarketplaceSummaryRow[] {
  const m = new Map<string, { sku: number; card: number }>();
  for (const s of skus) {
    const k = s.marketplace || "unknown";
    const cur = m.get(k) ?? { sku: 0, card: 0 };
    cur.sku += 1;
    m.set(k, cur);
  }
  for (const c of cards) {
    const k = c.marketplace || "unknown";
    const cur = m.get(k) ?? { sku: 0, card: 0 };
    cur.card += 1;
    m.set(k, cur);
  }
  return [...m.entries()]
    .map(([marketplace, v]) => ({
      marketplace,
      skuCount: v.sku,
      cardCount: v.card,
    }))
    .sort((a, b) => b.skuCount + b.cardCount - (a.skuCount + a.cardCount));
}

function buildStockModeSummary(skus: SkuEntityRow[], counts: Record<string, number>): StockModeSummaryRow[] {
  const merged = new Map<string, number>();
  for (const s of skus) {
    const m = normStock(s.stockMode);
    merged.set(m, (merged.get(m) ?? 0) + 1);
  }
  for (const [k, v] of Object.entries(counts)) {
    const m = normStock(k);
    if (!merged.has(m)) merged.set(m, v);
  }
  return [...merged.entries()]
    .map(([mode, count]) => {
      const { fboLike, fbsLike } = stockFlags(mode);
      return { mode, count, fboLike, fbsLike };
    })
    .sort((a, b) => b.count - a.count);
}

function buildSeoGap(cards: CardEntityRow[], skus: SkuEntityRow[]): SeoGapSummary {
  const cardsMissingSeo = cards.filter((c) => c.missingSeo).length;
  const byCorridor = new Map<string, number>();
  for (const c of cards) {
    if (!c.missingSeo) continue;
    const k = ckey(c.corridor);
    byCorridor.set(k, (byCorridor.get(k) ?? 0) + 1);
  }
  let topGapCorridor: string | null = null;
  let top = 0;
  for (const [cor, n] of byCorridor) {
    if (n > top) {
      top = n;
      topGapCorridor = cor;
    }
  }
  const skusInCorridorsWithoutSeoSignal = skus.filter((s) => {
    const cc = ckey(s.corridor);
    return cards.some((c) => ckey(c.corridor) === cc && c.missingSeo);
  }).length;
  return { cardsMissingSeo, skusInCorridorsWithoutSeoSignal, topGapCorridor };
}

function buildMissingSummary(skus: SkuEntityRow[], cards: CardEntityRow[]): MissingFieldSummary {
  const skuMissingCorridor = skus.filter((s) => !s.corridor.trim()).length;
  const skuMissingTitle = countMissing(skus, "title");
  const skuMissingWarehouse = countMissing(skus, "warehouse");
  const skuMissingStockMode = countMissing(skus, "stockMode");
  const skuMissingProductFamily = countMissing(skus, "productFamily");
  let cardMissingHero = 0;
  let cardMissingSeo = 0;
  let cardMissingWarehouse = 0;
  for (const c of cards) {
    if (c.missingHero) cardMissingHero++;
    if (c.missingSeo) cardMissingSeo++;
    if (c.missingWarehouse) cardMissingWarehouse++;
  }
  const totalSlots =
    skuMissingCorridor +
    skuMissingTitle +
    skuMissingWarehouse +
    skuMissingStockMode +
    skuMissingProductFamily +
    cardMissingHero +
    cardMissingSeo +
    cardMissingWarehouse;
  return {
    skuMissingCorridor,
    skuMissingTitle,
    skuMissingWarehouse,
    skuMissingStockMode,
    skuMissingProductFamily,
    cardMissingHero,
    cardMissingSeo,
    cardMissingWarehouse,
    totalSlots,
  };
}

function buildLaunchSummary(cards: CardEntityRow[]): LaunchCandidateSummary {
  const eligible = cards.filter((c) => c.cardTitle && c.cardTitle !== "—" && (!c.missingHero || !c.missingSeo));
  const m = new Map<string, number>();
  for (const c of eligible) {
    const k = ckey(c.corridor);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  const byCorridor = [...m.entries()]
    .map(([corridor, count]) => ({ corridor, count }))
    .sort((a, b) => b.count - a.count);
  return { eligibleCount: eligible.length, byCorridor };
}

function buildRefreshSummary(skus: SkuEntityRow[], cards: CardEntityRow[]): RefreshCandidateSummary {
  const weakSkuCount = skus.filter((s) => s.completeness !== "strong").length;
  const thinTitleCardCount = cards.filter((c) => !c.cardTitle || c.cardTitle === "—").length;
  const sampleSkuCodes = skus
    .filter((s) => s.completeness !== "strong")
    .slice(0, 5)
    .map((s) => s.skuCode)
    .filter(Boolean);
  return { weakSkuCount, thinTitleCardCount, sampleSkuCodes };
}

function buildFboExposure(skus: SkuEntityRow[]): FboExposureSummary {
  let fboLikeRows = 0;
  let fbsLikeRows = 0;
  let ambiguousOrEmpty = 0;
  const byCorridor = new Map<string, { hasFbo: boolean; hasFbs: boolean }>();
  for (const s of skus) {
    const { fboLike, fbsLike } = stockFlags(s.stockMode);
    if (fboLike) fboLikeRows++;
    else if (fbsLike) fbsLikeRows++;
    else ambiguousOrEmpty++;
    const k = ckey(s.corridor);
    const cur = byCorridor.get(k) ?? { hasFbo: false, hasFbs: false };
    if (fboLike) cur.hasFbo = true;
    if (fbsLike) cur.hasFbs = true;
    byCorridor.set(k, cur);
  }
  const mixedCorridors = [...byCorridor.entries()]
    .filter(([, v]) => v.hasFbo && v.hasFbs)
    .map(([corridor, v]) => ({ corridor, hasFbo: v.hasFbo, hasFbs: v.hasFbs }));
  return { fboLikeRows, fbsLikeRows, ambiguousOrEmpty, mixedCorridors };
}

function largestCorridor(rows: CorridorSummaryRow[]): string | null {
  return rows[0]?.corridor ?? null;
}

function heroCandidates(skus: SkuEntityRow[], topCorridor: string | null): { skuCode: string; corridor: string; completeness: string }[] {
  if (!topCorridor || topCorridor === "—") {
    return skus
      .filter((s) => s.completeness === "strong")
      .slice(0, 3)
      .map((s) => ({ skuCode: s.skuCode, corridor: ckey(s.corridor), completeness: s.completeness }));
  }
  return skus
    .filter((s) => ckey(s.corridor) === topCorridor && s.completeness !== "minimal")
    .slice(0, 4)
    .map((s) => ({ skuCode: s.skuCode, corridor: ckey(s.corridor), completeness: s.completeness }));
}

function buildActionQueue(
  snap: EntitySnapshot,
  corridorSummary: CorridorSummaryRow[],
  ms: MissingFieldSummary,
  seo: SeoGapSummary,
  launch: LaunchCandidateSummary,
  refresh: RefreshCandidateSummary,
  fbo: FboExposureSummary,
): SnapshotActionItem[] {
  const actions: SnapshotActionItem[] = [];
  const topCorridor = largestCorridor(corridorSummary) ?? "—";
  const wb = snap.marketplaceCounts["wb"] ?? 0;
  const oz = snap.marketplaceCounts["ozon"] ?? 0;

  if (seo.cardsMissingSeo > 0) {
    actions.push({
      id: "fill_seo_cluster",
      titleKey: "snapIntel.action.fillSeo.title",
      reasonKey: "snapIntel.action.fillSeo.reason",
      affectedCount: seo.cardsMissingSeo,
      priority: seo.cardsMissingSeo >= 10 ? "high" : "medium",
      sortScore: priorityScore(seo.cardsMissingSeo >= 10 ? "high" : "medium") + Math.min(seo.cardsMissingSeo, 40),
      corridor: seo.topGapCorridor ?? undefined,
      destination: "skuIntelligence",
      vars: { n: String(seo.cardsMissingSeo) },
    });
  }

  if (ms.skuMissingCorridor > 0) {
    actions.push({
      id: "assign_corridor",
      titleKey: "snapIntel.action.assignCorridor.title",
      reasonKey: "snapIntel.action.assignCorridor.reason",
      affectedCount: ms.skuMissingCorridor,
      priority: ms.skuMissingCorridor >= 8 ? "high" : "medium",
      sortScore: priorityScore("high") - 5 + Math.min(ms.skuMissingCorridor, 35),
      destination: "dataImport",
      vars: { n: String(ms.skuMissingCorridor) },
    });
  }

  if (wb > 0 && oz > 0) {
    actions.push({
      id: "split_marketplaces",
      titleKey: "snapIntel.action.splitMp.title",
      reasonKey: "snapIntel.action.splitMp.reason",
      affectedCount: wb + oz,
      priority: "medium",
      sortScore: priorityScore("medium") + 10,
      destination: "marketplaceOperations",
      vars: { wb: String(wb), oz: String(oz) },
    });
  }

  if (fbo.fboLikeRows > 0 && fbo.fbsLikeRows > 0) {
    actions.push({
      id: "fbo_capsule",
      titleKey: "snapIntel.action.fboPrep.title",
      reasonKey: "snapIntel.action.fboPrep.reason",
      affectedCount: fbo.fboLikeRows + fbo.fbsLikeRows,
      priority: "medium",
      sortScore: priorityScore("medium") + 8,
      destination: "marketplaceOperations",
      vars: { fbo: String(fbo.fboLikeRows), fbs: String(fbo.fbsLikeRows) },
    });
  }

  if (ms.skuMissingProductFamily > 0) {
    actions.push({
      id: "product_family",
      titleKey: "snapIntel.action.family.title",
      reasonKey: "snapIntel.action.family.reason",
      affectedCount: ms.skuMissingProductFamily,
      priority: "low",
      sortScore: priorityScore("low") + Math.min(ms.skuMissingProductFamily, 20),
      destination: "cardProduction",
      vars: { n: String(ms.skuMissingProductFamily) },
    });
  }

  if (topCorridor !== "—" && corridorSummary[0] && corridorSummary[0].total >= 3) {
    actions.push({
      id: "hero_largest_corridor",
      titleKey: "snapIntel.action.heroCorridor.title",
      reasonKey: "snapIntel.action.heroCorridor.reason",
      affectedCount: corridorSummary[0].total,
      priority: "low",
      sortScore: priorityScore("low") + corridorSummary[0].total,
      corridor: topCorridor,
      destination: "cardProduction",
      vars: { corridor: topCorridor, n: String(corridorSummary[0].total) },
    });
  }

  actions.push({
    id: "collection_top_corridor",
    titleKey: "snapIntel.action.collection.title",
    reasonKey: "snapIntel.action.collection.reason",
    affectedCount: corridorSummary[0]?.total ?? snap.skuEntities.length,
    priority: "low",
    sortScore: priorityScore("low") + 5,
    corridor: topCorridor,
    destination: "collectionBuilder",
    vars: { corridor: topCorridor },
  });

  if (seo.cardsMissingSeo > 0 && refresh.weakSkuCount > 0) {
    actions.push({
      id: "refresh_seo_wave",
      titleKey: "snapIntel.action.refreshSeo.title",
      reasonKey: "snapIntel.action.refreshSeo.reason",
      affectedCount: Math.min(seo.cardsMissingSeo, refresh.weakSkuCount),
      priority: "medium",
      sortScore: priorityScore("medium") + 12,
      corridor: seo.topGapCorridor ?? undefined,
      destination: "skuIntelligence",
      vars: { n: String(Math.min(seo.cardsMissingSeo, refresh.weakSkuCount)) },
    });
  }

  if (launch.eligibleCount > 0) {
    actions.push({
      id: "launch_queue",
      titleKey: "snapIntel.action.launch.title",
      reasonKey: "snapIntel.action.launch.reason",
      affectedCount: launch.eligibleCount,
      priority: "medium",
      sortScore: priorityScore("medium") + Math.min(launch.eligibleCount, 30),
      destination: "marketplaceOperations",
      vars: { n: String(launch.eligibleCount) },
    });
  }

  const emptySku = snap.skuEntities.filter((s) => !s.skuCode.trim()).length;
  if (emptySku > 0) {
    actions.push({
      id: "fix_sku_codes",
      titleKey: "snapIntel.action.fixSku.title",
      reasonKey: "snapIntel.action.fixSku.reason",
      affectedCount: emptySku,
      priority: "critical",
      sortScore: 120 + emptySku,
      destination: "dataImport",
      vars: { n: String(emptySku) },
    });
  }

  actions.sort((a, b) => b.sortScore - a.sortScore);

  return actions;
}

/** Derives operational intelligence from an active snapshot (import fields only). */
export function deriveSnapshotIntelligence(snapshot: EntitySnapshot): SnapshotIntelligence {
  const skus = snapshot.skuEntities;
  const cards = snapshot.cardEntities;
  const corridorSummary = buildCorridorSummary(skus, cards);
  const marketplaceSummary = buildMarketplaceSummary(skus, cards);
  const stockModeSummary = buildStockModeSummary(skus, snapshot.stockModeCounts);
  const seoGapSummary = buildSeoGap(cards, skus);
  const missingFieldSummary = buildMissingSummary(skus, cards);
  const launchCandidateSummary = buildLaunchSummary(cards);
  const refreshCandidateSummary = buildRefreshSummary(skus, cards);
  const fboExposureSummary = buildFboExposure(skus);
  const topCorridor = largestCorridor(corridorSummary);
  const heroCandidateSkus = heroCandidates(skus, topCorridor);
  const actionQueue = buildActionQueue(
    snapshot,
    corridorSummary,
    missingFieldSummary,
    seoGapSummary,
    launchCandidateSummary,
    refreshCandidateSummary,
    fboExposureSummary,
  );
  const top = actionQueue[0];
  const suggestedNextStepKey = top?.titleKey ?? "snapIntel.next.none";

  return {
    corridorSummary,
    marketplaceSummary,
    stockModeSummary,
    seoGapSummary,
    missingFieldSummary,
    launchCandidateSummary,
    refreshCandidateSummary,
    fboExposureSummary,
    actionQueue,
    heroCandidateSkus,
    suggestedNextStepKey,
  };
}

export type MopsBlockedGroup = {
  id: string;
  labelKey: string;
  count: number;
  corridor?: string;
  vars: Record<string, string>;
};

export function mopsLaunchCandidatesByCorridor(intel: SnapshotIntelligence): { corridor: string; count: number }[] {
  return intel.launchCandidateSummary.byCorridor.slice(0, 10);
}

export function mopsBlockedGroupsFromIntel(intel: SnapshotIntelligence): MopsBlockedGroup[] {
  const g: MopsBlockedGroup[] = [];
  const m = intel.missingFieldSummary;
  if (m.cardMissingSeo > 0) {
    g.push({
      id: "seo",
      labelKey: "snapIntel.mops.blockedSeo",
      count: m.cardMissingSeo,
      vars: { n: String(m.cardMissingSeo) },
    });
  }
  if (m.cardMissingWarehouse > 0) {
    g.push({
      id: "wh",
      labelKey: "snapIntel.mops.blockedWh",
      count: m.cardMissingWarehouse,
      vars: { n: String(m.cardMissingWarehouse) },
    });
  }
  if (m.skuMissingProductFamily > 0) {
    g.push({
      id: "fam",
      labelKey: "snapIntel.mops.blockedFamily",
      count: m.skuMissingProductFamily,
      vars: { n: String(m.skuMissingProductFamily) },
    });
  }
  return g;
}

export function mopsMarketplaceGrouping(intel: SnapshotIntelligence): MarketplaceSummaryRow[] {
  return intel.marketplaceSummary;
}

export function formatSnapshotTopActionLine(
  t: (key: string, vars?: Record<string, string>) => string,
  intel: SnapshotIntelligence | null,
): string | null {
  if (!intel || intel.actionQueue.length === 0) return null;
  const top = intel.actionQueue[0]!;
  const actionLabel = t(top.titleKey, top.vars);
  return t("entitySnap.mission.actionCue", { action: actionLabel });
}
