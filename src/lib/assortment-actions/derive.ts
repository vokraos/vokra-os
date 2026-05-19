import type { NavId } from "../../types";
import { deriveSnapshotIntelligence } from "../entity-snapshot/intelligence";
import type { SnapshotIntelligence } from "../entity-snapshot/intelligence";
import type { CardEntityRow, EntitySnapshot, SkuEntityRow } from "../entity-snapshot/types";
import { stableActionId } from "./hash";
import { ASSORTMENT_ECON_PLACEHOLDER } from "./prioritization";
import type {
  AssortmentAction,
  AssortmentActionCategory,
  AssortmentActionPriority,
  AssortmentActionType,
  AssortmentImpactLevel,
} from "./types";

const now = () => Date.now();

function trim(s: string): string {
  return (s ?? "").trim();
}

function pushAction(
  out: AssortmentAction[],
  args: {
    snapshot: EntitySnapshot;
    actionType: AssortmentActionType;
    category: AssortmentActionCategory;
    titleKey: string;
    reasonKey: string;
    titleVars: Record<string, string>;
    reasonVars: Record<string, string>;
    skuIds: string[];
    cardIds: string[];
    corridor?: string;
    marketplace?: string;
    priority: AssortmentActionPriority;
    expectedImpact: AssortmentImpactLevel;
    difficulty: AssortmentImpactLevel;
    ownerSystem: string;
    suggestedDestination: NavId;
    stableParts: string[];
  },
) {
  const { snapshot, skuIds, cardIds, stableParts, ...rest } = args;
  if (skuIds.length === 0 && cardIds.length === 0) return;
  out.push({
    id: stableActionId([snapshot.id, rest.actionType, ...stableParts]),
    sourceSnapshotId: snapshot.id,
    actionType: rest.actionType,
    category: rest.category,
    titleKey: rest.titleKey,
    reasonKey: rest.reasonKey,
    titleVars: rest.titleVars,
    reasonVars: rest.reasonVars,
    affectedSkuIds: [...new Set(skuIds)],
    affectedCardIds: [...new Set(cardIds)],
    corridor: rest.corridor,
    marketplace: rest.marketplace,
    priority: rest.priority,
    expectedImpact: rest.expectedImpact,
    difficulty: rest.difficulty,
    ownerSystem: rest.ownerSystem,
    suggestedDestination: rest.suggestedDestination,
    status: "new",
    createdAt: now(),
    ...ASSORTMENT_ECON_PLACEHOLDER,
  });
}

function skuCodesMissingField(skus: SkuEntityRow[], field: string): string[] {
  return skus.filter((s) => s.missingFields.includes(field)).map((s) => s.id);
}

function cardsMissingSeo(cards: CardEntityRow[]): string[] {
  return cards.filter((c) => c.missingSeo).map((c) => c.id);
}

function duplicateSkuRisk(skus: SkuEntityRow[]): { dupCodes: string[]; skuIds: string[] } {
  const by = new Map<string, SkuEntityRow[]>();
  for (const s of skus) {
    const k = trim(s.skuCode) || trim(s.article);
    if (!k) continue;
    const arr = by.get(k) ?? [];
    arr.push(s);
    by.set(k, arr);
  }
  const dupCodes: string[] = [];
  const skuIds: string[] = [];
  for (const [code, rows] of by) {
    if (rows.length > 1) {
      dupCodes.push(code);
      rows.forEach((r) => skuIds.push(r.id));
    }
  }
  return { dupCodes, skuIds };
}

/**
 * Structural assortment actions from snapshot intelligence only (no pressure enrichment).
 */
export function deriveStructuralAssortmentActions(
  snapshot: EntitySnapshot,
  intel: SnapshotIntelligence = deriveSnapshotIntelligence(snapshot),
): AssortmentAction[] {
  const skus = snapshot.skuEntities;
  const cards = snapshot.cardEntities;
  const out: AssortmentAction[] = [];

  const ms = intel.missingFieldSummary;

  const seoCardIds = cardsMissingSeo(cards);
  if (seoCardIds.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "improve_seo",
      category: "fix",
      titleKey: "aa.fix.seo.title",
      reasonKey: "aa.fix.seo.reason",
      titleVars: { n: String(seoCardIds.length) },
      reasonVars: { n: String(seoCardIds.length) },
      skuIds: [],
      cardIds: seoCardIds,
      corridor: intel.seoGapSummary.topGapCorridor ?? undefined,
      priority: "high",
      expectedImpact: "high",
      difficulty: "medium",
      ownerSystem: "sku_intelligence",
      suggestedDestination: "seo",
      stableParts: ["seo", ...seoCardIds.slice(0, 8)],
    });
  }

  const corSku = skus.filter((s) => !trim(s.corridor) || trim(s.corridor) === "—").map((s) => s.id);
  if (corSku.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "assign_corridor",
      category: "fix",
      titleKey: "aa.fix.corridor.title",
      reasonKey: "aa.fix.corridor.reason",
      titleVars: { n: String(corSku.length) },
      reasonVars: { n: String(corSku.length) },
      skuIds: corSku,
      cardIds: [],
      priority: "high",
      expectedImpact: "high",
      difficulty: "low",
      ownerSystem: "data_cleanup",
      suggestedDestination: "dataCleanup",
      stableParts: ["cor", ...corSku.slice(0, 8)],
    });
  }

  const famSku = skus.filter((s) => !trim(s.productFamily)).map((s) => s.id);
  if (famSku.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "fix_data",
      category: "fix",
      titleKey: "aa.fix.family.title",
      reasonKey: "aa.fix.family.reason",
      titleVars: { n: String(famSku.length) },
      reasonVars: { n: String(famSku.length) },
      skuIds: famSku,
      cardIds: [],
      priority: "medium",
      expectedImpact: "medium",
      difficulty: "low",
      ownerSystem: "sku_intelligence",
      suggestedDestination: "dataCleanup",
      stableParts: ["fam", ...famSku.slice(0, 8)],
    });
  }

  const mpSku = skus.filter((s) => s.marketplace === "unknown").map((s) => s.id);
  if (mpSku.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "fix_data",
      category: "fix",
      titleKey: "aa.fix.mp.title",
      reasonKey: "aa.fix.mp.reason",
      titleVars: { n: String(mpSku.length) },
      reasonVars: { n: String(mpSku.length) },
      skuIds: mpSku,
      cardIds: [],
      priority: "high",
      expectedImpact: "high",
      difficulty: "medium",
      ownerSystem: "marketplace_operations",
      suggestedDestination: "dataCleanup",
      stableParts: ["mpu", ...mpSku.slice(0, 8)],
    });
  }

  const stSku = skuCodesMissingField(skus, "stockMode");
  if (stSku.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "fix_data",
      category: "fbo",
      titleKey: "aa.fix.stock.title",
      reasonKey: "aa.fix.stock.reason",
      titleVars: { n: String(stSku.length) },
      reasonVars: { n: String(stSku.length) },
      skuIds: stSku,
      cardIds: [],
      priority: "medium",
      expectedImpact: "medium",
      difficulty: "low",
      ownerSystem: "marketplace_operations",
      suggestedDestination: "dataCleanup",
      stableParts: ["stk", ...stSku.slice(0, 8)],
    });
  }

  const titleSku = skuCodesMissingField(skus, "title");
  if (titleSku.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "fix_data",
      category: "fix",
      titleKey: "aa.fix.title.title",
      reasonKey: "aa.fix.title.reason",
      titleVars: { n: String(titleSku.length) },
      reasonVars: { n: String(titleSku.length) },
      skuIds: titleSku,
      cardIds: [],
      priority: "critical",
      expectedImpact: "high",
      difficulty: "low",
      ownerSystem: "sku_intelligence",
      suggestedDestination: "dataImport",
      stableParts: ["ttl", ...titleSku.slice(0, 8)],
    });
  }

  const top = intel.corridorSummary[0];
  if (top && top.corridor && top.corridor !== "—" && top.total >= 2) {
    const topCorridor = top.corridor;
    const cardCorridorBySku = new Map<string, string>();
    for (const c of cards) {
      const code = trim(c.skuCode);
      if (!code) continue;
      cardCorridorBySku.set(code, trim(c.corridor));
    }
    const skuIn = skus.filter((s) => {
      const skuCorridor = trim(s.corridor);
      if (skuCorridor === topCorridor) return true;
      if (!skuCorridor || skuCorridor === "—") {
        return cardCorridorBySku.get(trim(s.skuCode)) === topCorridor;
      }
      return false;
    });
    const skuIds = skuIn.map((s) => s.id);
    const cardIds = cards.filter((c) => trim(c.corridor) === top.corridor).map((c) => c.id);
    pushAction(out, {
      snapshot,
      actionType: "create_collection",
      category: "collection",
      titleKey: "aa.growth.collection.title",
      reasonKey: "aa.growth.collection.reason",
      titleVars: { corridor: top.corridor, n: String(top.total) },
      reasonVars: { corridor: top.corridor, n: String(top.total) },
      skuIds,
      cardIds,
      corridor: top.corridor,
      priority: "medium",
      expectedImpact: "high",
      difficulty: "medium",
      ownerSystem: "collection_builder",
      suggestedDestination: "collectionBuilder",
      stableParts: ["col", top.corridor],
    });
  }

  const heroes = skus.filter((s) => s.heroCandidate).map((s) => s.id);
  if (heroes.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "promote_hero_candidate",
      category: "growth",
      titleKey: "aa.growth.hero.title",
      reasonKey: "aa.growth.hero.reason",
      titleVars: { n: String(heroes.length) },
      reasonVars: { n: String(heroes.length) },
      skuIds: heroes,
      cardIds: [],
      corridor: intel.corridorSummary[0]?.corridor,
      priority: "medium",
      expectedImpact: "high",
      difficulty: "low",
      ownerSystem: "sku_intelligence",
      suggestedDestination: "visualStrategy",
      stableParts: ["hero", ...heroes.slice(0, 8)],
    });
  }

  if (intel.fboExposureSummary.fboLikeRows > 0 && intel.fboExposureSummary.mixedCorridors.length > 0) {
    const mixed = intel.fboExposureSummary.mixedCorridors.slice(0, 3);
    for (const m of mixed) {
      const skuIds = skus.filter((s) => (trim(s.corridor) || "—") === m.corridor && /\bfbo\b|фбо/i.test(s.stockMode + s.title)).map((s) => s.id);
      pushAction(out, {
        snapshot,
        actionType: "prepare_fbo",
        category: "fbo",
        titleKey: "aa.fbo.mixedCorridor.title",
        reasonKey: "aa.fbo.mixedCorridor.reason",
        titleVars: { corridor: m.corridor },
        reasonVars: { corridor: m.corridor },
        skuIds: skuIds.length ? skuIds : skus.filter((s) => (trim(s.corridor) || "—") === m.corridor).map((s) => s.id).slice(0, 12),
        cardIds: [],
        corridor: m.corridor,
        priority: "medium",
        expectedImpact: "medium",
        difficulty: "high",
        ownerSystem: "marketplace_operations",
        suggestedDestination: "marketplaceOperations",
        stableParts: ["fboMix", m.corridor],
      });
    }
  } else if (intel.fboExposureSummary.fboLikeRows > 0) {
    pushAction(out, {
      snapshot,
      actionType: "prepare_fbo",
      category: "fbo",
      titleKey: "aa.fbo.exposure.title",
      reasonKey: "aa.fbo.exposure.reason",
      titleVars: {
        fbo: String(intel.fboExposureSummary.fboLikeRows),
        fbs: String(intel.fboExposureSummary.fbsLikeRows),
      },
      reasonVars: {
        fbo: String(intel.fboExposureSummary.fboLikeRows),
        fbs: String(intel.fboExposureSummary.fbsLikeRows),
      },
      skuIds: skus.filter((s) => /\bfbo\b|фбо/i.test(s.stockMode + s.title)).map((s) => s.id).slice(0, 24),
      cardIds: [],
      priority: "low",
      expectedImpact: "medium",
      difficulty: "medium",
      ownerSystem: "marketplace_operations",
      suggestedDestination: "marketplaceOperations",
      stableParts: ["fboExp"],
    });
  }

  if (intel.launchCandidateSummary.eligibleCount > 0) {
    const topL = intel.launchCandidateSummary.byCorridor[0];
    const cardIds = cards
      .filter((c) => c.cardTitle && c.cardTitle !== "—" && (!c.missingHero || !c.missingSeo))
      .filter((c) => !topL || (trim(c.corridor) || "—") === topL.corridor)
      .map((c) => c.id)
      .slice(0, 40);
    pushAction(out, {
      snapshot,
      actionType: "launch_wave",
      category: "growth",
      titleKey: "aa.growth.launch.title",
      reasonKey: "aa.growth.launch.reason",
      titleVars: { n: String(intel.launchCandidateSummary.eligibleCount) },
      reasonVars: { n: String(intel.launchCandidateSummary.eligibleCount), corridor: topL?.corridor ?? "—" },
      skuIds: [],
      cardIds: cardIds.length ? cardIds : cards.map((c) => c.id).slice(0, 20),
      corridor: topL?.corridor,
      priority: "medium",
      expectedImpact: "high",
      difficulty: "high",
      ownerSystem: "marketplace_operations",
      suggestedDestination: "marketplaceOperations",
      stableParts: ["launch"],
    });
  }

  const weakSku = skus.filter((s) => s.completeness === "weak" || s.completeness === "minimal").map((s) => s.id);
  if (weakSku.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "archive_weak_sku",
      category: "risk",
      titleKey: "aa.risk.weak.title",
      reasonKey: "aa.risk.weak.reason",
      titleVars: { n: String(weakSku.length) },
      reasonVars: { n: String(weakSku.length) },
      skuIds: weakSku,
      cardIds: [],
      priority: "low",
      expectedImpact: "low",
      difficulty: "medium",
      ownerSystem: "sku_intelligence",
      suggestedDestination: "skuIntelligence",
      stableParts: ["weak", ...weakSku.slice(0, 8)],
    });
  }

  const whSku = skuCodesMissingField(skus, "warehouse");
  const whCard = cards.filter((c) => c.missingWarehouse).map((c) => c.id);
  if (whSku.length + whCard.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "fix_data",
      category: "risk",
      titleKey: "aa.risk.wh.title",
      reasonKey: "aa.risk.wh.reason",
      titleVars: { n: String(whSku.length + whCard.length) },
      reasonVars: { n: String(whSku.length + whCard.length) },
      skuIds: whSku,
      cardIds: whCard,
      priority: "high",
      expectedImpact: "medium",
      difficulty: "low",
      ownerSystem: "marketplace_operations",
      suggestedDestination: "dataCleanup",
      stableParts: ["wh", ...whSku.slice(0, 6), ...whCard.slice(0, 6)],
    });
  }

  const wb = snapshot.marketplaceCounts.wb ?? 0;
  const oz = snapshot.marketplaceCounts.ozon ?? 0;
  const unk = snapshot.marketplaceCounts.unknown ?? 0;
  if (wb > 0 && oz > 0 && (unk > 0 || ms.skuMissingCorridor > 0)) {
    pushAction(out, {
      snapshot,
      actionType: "split_marketplace_group",
      category: "risk",
      titleKey: "aa.risk.split.title",
      reasonKey: "aa.risk.split.reason",
      titleVars: { wb: String(wb), oz: String(oz), unk: String(unk) },
      reasonVars: { wb: String(wb), oz: String(oz), unk: String(unk) },
      skuIds: skus.filter((s) => s.marketplace === "unknown").map((s) => s.id),
      cardIds: [],
      priority: "medium",
      expectedImpact: "medium",
      difficulty: "medium",
      ownerSystem: "marketplace_operations",
      suggestedDestination: "dataCleanup",
      stableParts: ["split", String(wb), String(oz)],
    });
  }

  const { dupCodes, skuIds: dupIds } = duplicateSkuRisk(skus);
  if (dupIds.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "fix_data",
      category: "risk",
      titleKey: "aa.risk.dup.title",
      reasonKey: "aa.risk.dup.reason",
      titleVars: { n: String(dupCodes.length) },
      reasonVars: { codes: dupCodes.slice(0, 6).join(", ") },
      skuIds: dupIds,
      cardIds: [],
      priority: "critical",
      expectedImpact: "high",
      difficulty: "low",
      ownerSystem: "sku_intelligence",
      suggestedDestination: "dataImport",
      stableParts: ["dup", ...dupCodes.slice(0, 6)],
    });
  }

  const refreshSku = skus.filter((s) => s.refreshCandidate).map((s) => s.id);
  if (refreshSku.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "refresh_visual",
      category: "visual",
      titleKey: "aa.vis.refresh.title",
      reasonKey: "aa.vis.refresh.reason",
      titleVars: { n: String(refreshSku.length) },
      reasonVars: { n: String(refreshSku.length) },
      skuIds: refreshSku,
      cardIds: [],
      priority: "medium",
      expectedImpact: "medium",
      difficulty: "high",
      ownerSystem: "visual_production",
      suggestedDestination: "visualProduction",
      stableParts: ["ref", ...refreshSku.slice(0, 8)],
    });
  }

  const thinCards = cards.filter((c) => !trim(c.cardTitle) || c.cardTitle === "—").map((c) => c.id);
  if (thinCards.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "refresh_visual",
      category: "visual",
      titleKey: "aa.vis.thinCard.title",
      reasonKey: "aa.vis.thinCard.reason",
      titleVars: { n: String(thinCards.length) },
      reasonVars: { n: String(thinCards.length) },
      skuIds: [],
      cardIds: thinCards,
      priority: "medium",
      expectedImpact: "medium",
      difficulty: "medium",
      ownerSystem: "card_production",
      suggestedDestination: "cardProduction",
      stableParts: ["thin", ...thinCards.slice(0, 8)],
    });
  }

  const heroLater = cards.filter((c) => c.missingHero).map((c) => c.id);
  if (heroLater.length > 0) {
    pushAction(out, {
      snapshot,
      actionType: "refresh_visual",
      category: "visual",
      titleKey: "aa.vis.heroLater.title",
      reasonKey: "aa.vis.heroLater.reason",
      titleVars: { n: String(heroLater.length) },
      reasonVars: { n: String(heroLater.length) },
      skuIds: [],
      cardIds: heroLater.slice(0, 30),
      priority: "low",
      expectedImpact: "medium",
      difficulty: "high",
      ownerSystem: "visual_production",
      suggestedDestination: "visualProduction",
      stableParts: ["herolater", ...heroLater.slice(0, 6)],
    });
  }

  out.sort((a, b) => {
    const order = (p: AssortmentActionPriority) => (p === "critical" ? 0 : p === "high" ? 1 : p === "medium" ? 2 : 3);
    const d = order(a.priority) - order(b.priority);
    if (d !== 0) return d;
    return b.affectedSkuIds.length + b.affectedCardIds.length - (a.affectedSkuIds.length + a.affectedCardIds.length);
  });

  return out;
}

export function summarizeAssortmentActions(actions: readonly AssortmentAction[]): {
  total: number;
  newCount: number;
  criticalNew: number;
  quickWinNew: number;
} {
  let newCount = 0;
  let criticalNew = 0;
  let quickWinNew = 0;
  for (const a of actions) {
    if (a.status === "new") {
      newCount++;
      if (a.priority === "critical") criticalNew++;
      if (a.executiveQueues.includes("quick_wins")) quickWinNew++;
    }
  }
  return { total: actions.length, newCount, criticalNew, quickWinNew };
}
