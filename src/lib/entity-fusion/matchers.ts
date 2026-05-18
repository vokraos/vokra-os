import type { CardProductionPlan } from "../card-production/types";
import type { ImportedRowSummary, MatchedEntityRef, StrategicEntityKind } from "./types";
import { fusionLevelFromScore } from "./confidence";
import { canonicalSkuKey } from "./normalization";

function scoreExact(a: string, b: string): number {
  return canonicalSkuKey(a) === canonicalSkuKey(b) ? 1 : 0;
}

function scoreFuzzyArticle(a: string, b: string): number {
  const A = canonicalSkuKey(a);
  const B = canonicalSkuKey(b);
  if (A === B) return 1;
  if (A.includes(B) || B.includes(A)) return 0.72;
  return 0;
}

/** WB/Ozon article or offer string → SKU / plan family heuristics. */
export function matchImportedRowToSkuEntity(
  row: ImportedRowSummary,
  skuFamilies: readonly string[],
): { family: string | null; score01: number } {
  let best: { family: string | null; score01: number } = { family: null, score01: 0 };
  for (const fam of skuFamilies) {
    const s = Math.max(scoreExact(row.articleOrOffer, fam), scoreFuzzyArticle(row.articleOrOffer, fam));
    if (s > best.score01) best = { family: fam, score01: s };
  }
  return best;
}

export function matchOfferToCardPlan(row: ImportedRowSummary, plans: readonly CardProductionPlan[]): CardProductionPlan | null {
  if (row.source !== "ozon") return null;
  for (const p of plans) {
    if (p.marketplace === "ozon" || p.marketplace === "both") {
      if (canonicalSkuKey(p.targetSkuFamily) === canonicalSkuKey(row.articleOrOffer)) return p;
    }
  }
  return null;
}

export function matchArticleToCardPlan(row: ImportedRowSummary, plans: readonly CardProductionPlan[]): CardProductionPlan | null {
  if (row.source !== "wb") return null;
  for (const p of plans) {
    if (p.marketplace === "wb" || p.marketplace === "both") {
      if (canonicalSkuKey(p.targetSkuFamily) === canonicalSkuKey(row.articleOrOffer)) return p;
    }
  }
  return null;
}

export function buildMatchedEntityRefs(
  rows: readonly ImportedRowSummary[],
  plans: readonly CardProductionPlan[],
  waveIds: readonly string[],
  assetHeroByPlan: ReadonlyMap<string, string | null>,
): MatchedEntityRef[] {
  const skuFamilies = [...new Set(plans.map((p) => p.targetSkuFamily).filter(Boolean))];
  const refs: MatchedEntityRef[] = [];

  for (const row of rows) {
    const skuHit = matchImportedRowToSkuEntity(row, skuFamilies);
    if (skuHit.family && skuHit.score01 > 0.2) {
      refs.push({
        id: `sku:${canonicalSkuKey(skuHit.family)}`,
        kind: "sku_entity",
        label: skuHit.family,
        confidence: fusionLevelFromScore(skuHit.score01),
        score01: skuHit.score01,
        matchedFromRowKeys: [row.rowKey],
      });
    }

    const plan = row.source === "ozon" ? matchOfferToCardPlan(row, plans) : matchArticleToCardPlan(row, plans);
    if (plan) {
      const s = row.source === "ozon" ? 0.86 : 0.91;
      refs.push({
        id: plan.id,
        kind: "card_production_plan",
        label: plan.cardTitle || plan.targetSkuFamily,
        confidence: fusionLevelFromScore(s),
        score01: s,
        matchedFromRowKeys: [row.rowKey],
      });
      const heroId = plan.heroVisualId ?? assetHeroByPlan.get(plan.id) ?? null;
      if (heroId) {
        refs.push({
          id: heroId,
          kind: "visual_asset",
          label: `hero:${plan.targetSkuFamily}`,
          confidence: fusionLevelFromScore(0.63),
          score01: 0.63,
          matchedFromRowKeys: [row.rowKey],
        });
      }
    }
  }

  for (const wid of waveIds.slice(0, 3)) {
    refs.push({
      id: wid,
      kind: "launch_wave",
      label: wid,
      confidence: fusionLevelFromScore(0.55),
      score01: 0.55,
      matchedFromRowKeys: rows.slice(0, 1).map((r) => r.rowKey),
    });
  }

  const collIds = [...new Set(plans.map((p) => p.collectionId).filter(Boolean))];
  for (const cid of collIds.slice(0, 2)) {
    refs.push({
      id: cid,
      kind: "collection",
      label: cid,
      confidence: fusionLevelFromScore(0.74),
      score01: 0.74,
      matchedFromRowKeys: rows.slice(0, 1).map((r) => r.rowKey),
    });
  }

  if (plans.length > 0) {
    refs.push({
      id: "mops:operational_session",
      kind: "marketplace_operations",
      label: "launch_ops",
      confidence: fusionLevelFromScore(0.61),
      score01: 0.61,
      matchedFromRowKeys: rows.slice(0, 2).map((r) => r.rowKey),
    });
  }

  const uniq = new Map<string, MatchedEntityRef>();
  for (const r of refs) {
    const k = `${r.kind}:${r.id}`;
    const prev = uniq.get(k);
    if (!prev || r.score01 > prev.score01) uniq.set(k, r);
  }
  return [...uniq.values()];
}

export function strategicEntityKindLabelKey(kind: StrategicEntityKind): string {
  return `fusion.entity.${kind}`;
}
