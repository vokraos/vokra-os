import { deriveSnapshotIntelligence, type SnapshotIntelligence } from "../intelligence";
import type { EntitySnapshot, SkuEntityRow } from "../types";
import { inferFromTitle, inferSeoClusterFromContext } from "./heuristics";
import { snapshotReadinessScore } from "./readiness";
import type { CleanupBatchAction, EntityCleanupPlan, MissingFieldGroup, SuggestedValueGroup } from "./types";

function newPlanId(): string {
  return `ecp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function trim(s: string): string {
  return (s ?? "").trim();
}

function estimateAfterApply(before: number, actions: CleanupBatchAction[]): number {
  let pts = 0;
  for (const a of actions) {
    if (a.kind === "ignore_defer") continue;
    if (a.confidence === "low") pts += Math.min(6, Math.ceil(a.affectedCount / 8));
    else if (a.confidence === "medium") pts += Math.min(10, Math.ceil(a.affectedCount / 5));
    else pts += Math.min(14, Math.ceil(a.affectedCount / 4));
  }
  return Math.min(100, before + Math.min(38, pts));
}

type GroupAcc = Map<
  string,
  { skuIds: string[]; codes: string[]; titles: string[]; confidence: "high" | "medium" | "low" }
>;

function pushGroup(
  acc: GroupAcc,
  key: string,
  skuId: string,
  code: string,
  title: string,
  confidence: "high" | "medium" | "low",
) {
  const cur = acc.get(key) ?? { skuIds: [], codes: [], titles: [], confidence };
  if (!cur.skuIds.includes(skuId)) cur.skuIds.push(skuId);
  if (!cur.codes.includes(code)) cur.codes.push(code);
  if (cur.titles.length < 4 && title) cur.titles.push(title);
  if (confidenceRank(confidence) > confidenceRank(cur.confidence)) cur.confidence = confidence;
  acc.set(key, cur);
}

function confidenceRank(c: "high" | "medium" | "low"): number {
  if (c === "high") return 3;
  if (c === "medium") return 2;
  return 1;
}

function missingGroupsFromSnapshot(s: EntitySnapshot, intel: SnapshotIntelligence): MissingFieldGroup[] {
  const m = intel.missingFieldSummary;
  const sku = s.skuEntities;
  const cards = s.cardEntities;
  const out: MissingFieldGroup[] = [];

  const pickSku = (pred: (x: SkuEntityRow) => boolean) =>
    sku.filter(pred).map((x) => x.skuCode || x.article).filter(Boolean).slice(0, 5);

  const corN = sku.filter((x) => !trim(x.corridor) || trim(x.corridor) === "—").length;
  if (corN > 0) {
    out.push({
      id: "mf_corridor",
      field: "corridor",
      labelKey: "dataCleanup.mf.corridor",
      affectedSkuCount: corN,
      affectedCardCount: 0,
      sampleCodes: pickSku((x) => !trim(x.corridor) || trim(x.corridor) === "—"),
    });
  }
  if (m.skuMissingTitle > 0) {
    out.push({
      id: "mf_title",
      field: "title",
      labelKey: "dataCleanup.mf.title",
      affectedSkuCount: m.skuMissingTitle,
      affectedCardCount: 0,
      sampleCodes: pickSku((x) => !trim(x.title)),
    });
  }
  if (m.skuMissingWarehouse > 0) {
    out.push({
      id: "mf_wh_sku",
      field: "warehouse",
      labelKey: "dataCleanup.mf.whSku",
      affectedSkuCount: m.skuMissingWarehouse,
      affectedCardCount: 0,
      sampleCodes: pickSku((x) => !trim(x.warehouse)),
    });
  }
  if (m.skuMissingStockMode > 0) {
    out.push({
      id: "mf_stock",
      field: "stockMode",
      labelKey: "dataCleanup.mf.stock",
      affectedSkuCount: m.skuMissingStockMode,
      affectedCardCount: 0,
      sampleCodes: pickSku((x) => !trim(x.stockMode)),
    });
  }
  const famN = sku.filter((x) => !trim(x.productFamily)).length;
  if (famN > 0) {
    out.push({
      id: "mf_family",
      field: "productFamily",
      labelKey: "dataCleanup.mf.family",
      affectedSkuCount: famN,
      affectedCardCount: 0,
      sampleCodes: pickSku((x) => !trim(x.productFamily)),
    });
  }
  if (m.cardMissingSeo > 0) {
    out.push({
      id: "mf_seo_card",
      field: "seoCluster",
      labelKey: "dataCleanup.mf.seoCard",
      affectedSkuCount: 0,
      affectedCardCount: m.cardMissingSeo,
      sampleCodes: cards.filter((c) => c.missingSeo).map((c) => c.skuCode).slice(0, 5),
    });
  }
  if (m.cardMissingHero > 0) {
    out.push({
      id: "mf_hero",
      field: "hero",
      labelKey: "dataCleanup.mf.hero",
      affectedSkuCount: 0,
      affectedCardCount: m.cardMissingHero,
      sampleCodes: cards.filter((c) => c.missingHero).map((c) => c.skuCode).slice(0, 5),
    });
  }
  if (m.cardMissingWarehouse > 0) {
    out.push({
      id: "mf_wh_card",
      field: "warehouseCard",
      labelKey: "dataCleanup.mf.whCard",
      affectedSkuCount: 0,
      affectedCardCount: m.cardMissingWarehouse,
      sampleCodes: cards.filter((c) => c.missingWarehouse).map((c) => c.skuCode).slice(0, 5),
    });
  }

  return out;
}

function corridorSuggestions(s: EntitySnapshot): SuggestedValueGroup[] {
  const acc: GroupAcc = new Map();
  for (const row of s.skuEntities) {
    const title = trim(row.title);
    if (trim(row.corridor) && trim(row.corridor) !== "—") continue;
    const inf = inferFromTitle(title);
    if (!inf?.corridor) continue;
    pushGroup(acc, inf.corridor, row.id, row.skuCode || row.article, title, inf.confidence);
  }
  return [...acc.entries()].map(([proposedValue, v]) => ({
    id: `sg_cor_${proposedValue}`,
    proposedValue,
    confidence: v.confidence,
    reasonKey: "dataCleanup.sg.corridorReason",
    skuCodes: v.codes.slice(0, 12),
    previewTitles: v.titles,
  }));
}

function familySuggestions(s: EntitySnapshot): SuggestedValueGroup[] {
  const acc: GroupAcc = new Map();
  for (const row of s.skuEntities) {
    const title = trim(row.title);
    if (trim(row.productFamily)) continue;
    const inf = inferFromTitle(title);
    if (!inf?.productFamily) continue;
    pushGroup(acc, inf.productFamily, row.id, row.skuCode || row.article, title, inf.confidence);
  }
  return [...acc.entries()].map(([proposedValue, v]) => ({
    id: `sg_fam_${proposedValue}`,
    proposedValue,
    confidence: v.confidence,
    reasonKey: "dataCleanup.sg.familyReason",
    skuCodes: v.codes.slice(0, 12),
    previewTitles: v.titles,
  }));
}

function seoSuggestions(s: EntitySnapshot): SuggestedValueGroup[] {
  const acc = new Map<string, { cardIds: string[]; codes: string[]; titles: string[]; confidence: "high" | "medium" | "low" }>();
  const skuByCode = new Map<string, (typeof s.skuEntities)[number]>();
  for (const row of s.skuEntities) {
    const code = trim(row.skuCode);
    if (code) skuByCode.set(code, row);
  }

  for (const c of s.cardEntities) {
    if (!c.missingSeo) continue;
    const sku = skuByCode.get(trim(c.skuCode));
    const title = trim(sku?.title ?? c.cardTitle);
    const cor = trim(sku?.corridor ?? c.corridor);
    const hint = inferSeoClusterFromContext(title, cor);
    if (!hint) continue;
    const cur = acc.get(hint.value) ?? { cardIds: [], codes: [], titles: [], confidence: "low" };
    if (!cur.cardIds.includes(c.id)) cur.cardIds.push(c.id);
    if (!cur.codes.includes(c.skuCode)) cur.codes.push(c.skuCode);
    if (cur.titles.length < 4 && title) cur.titles.push(title);
    if (confidenceRank(hint.confidence) > confidenceRank(cur.confidence)) cur.confidence = hint.confidence;
    acc.set(hint.value, cur);
  }

  return [...acc.entries()].map(([proposedValue, v]) => ({
    id: `sg_seo_${proposedValue.replace(/[^\w-]+/g, "_").slice(0, 40)}`,
    proposedValue,
    confidence: v.confidence,
    reasonKey: "dataCleanup.sg.seoReason",
    skuCodes: v.codes.slice(0, 12),
    previewTitles: v.titles,
  }));
}

function buildBatchActions(s: EntitySnapshot, intel: SnapshotIntelligence): CleanupBatchAction[] {
  const actions: CleanupBatchAction[] = [];
  let idx = 0;
  const add = (a: Omit<CleanupBatchAction, "id" | "status"> & { id?: string }) => {
    const id = a.id ?? `ba_${(++idx).toString(36)}_${Date.now().toString(36)}`;
    actions.push({ ...a, id, status: "pending" });
  };

  const unknownSkus = s.skuEntities.filter((x) => x.marketplace === "unknown");

  for (const g of corridorSuggestions(s)) {
    const skuIds = s.skuEntities.filter((r) => g.skuCodes.includes(r.skuCode || r.article)).map((r) => r.id);
    if (skuIds.length === 0) continue;
    add({
      kind: "assign_corridor",
      titleKey: "dataCleanup.action.assignCorridor.title",
      reasonKey: "dataCleanup.action.assignCorridor.reason",
      affectedCount: skuIds.length,
      confidence: g.confidence,
      previewExamples: g.previewTitles,
      assignValue: g.proposedValue,
      targetSkuIds: skuIds,
      vars: { value: g.proposedValue, n: String(skuIds.length) },
    });
  }

  for (const g of familySuggestions(s)) {
    const skuIds = s.skuEntities.filter((r) => g.skuCodes.includes(r.skuCode || r.article)).map((r) => r.id);
    if (skuIds.length === 0) continue;
    add({
      kind: "assign_product_family",
      titleKey: "dataCleanup.action.assignFamily.title",
      reasonKey: "dataCleanup.action.assignFamily.reason",
      affectedCount: skuIds.length,
      confidence: g.confidence,
      previewExamples: g.previewTitles,
      assignValue: g.proposedValue,
      targetSkuIds: skuIds,
      vars: { value: g.proposedValue, n: String(skuIds.length) },
    });
  }

  for (const g of seoSuggestions(s)) {
    const cardIds = s.cardEntities.filter((c) => c.missingSeo && g.skuCodes.includes(c.skuCode)).map((c) => c.id);
    if (cardIds.length === 0) continue;
    add({
      kind: "assign_seo_cluster",
      titleKey: "dataCleanup.action.assignSeo.title",
      reasonKey: "dataCleanup.action.assignSeo.reason",
      affectedCount: cardIds.length,
      confidence: g.confidence,
      previewExamples: g.previewTitles,
      assignValue: g.proposedValue,
      targetCardIds: cardIds,
      vars: { value: g.proposedValue, n: String(cardIds.length) },
    });
  }

  if (unknownSkus.length > 0) {
    const wb = s.marketplaceCounts.wb ?? 0;
    const oz = s.marketplaceCounts.ozon ?? 0;
    if (wb + oz > 0) {
      const dominant: "wb" | "ozon" = wb >= oz ? "wb" : "ozon";
      const conf: "medium" | "low" = wb === 0 || oz === 0 ? "medium" : "low";
      add({
        kind: "assign_marketplace",
        titleKey: "dataCleanup.action.assignMp.title",
        reasonKey: "dataCleanup.action.assignMp.reason",
        affectedCount: unknownSkus.length,
        confidence: conf,
        previewExamples: unknownSkus.map((u) => u.title || u.skuCode).filter(Boolean).slice(0, 4),
        assignValue: dominant,
        targetSkuIds: unknownSkus.map((u) => u.id),
        vars: { mp: dominant, n: String(unknownSkus.length) },
      });
    }
  }

  const stockInfers = s.skuEntities.filter((r) => {
    if (trim(r.stockMode)) return false;
    const inf = inferFromTitle(trim(r.title));
    return Boolean(inf?.stockMode);
  });
  if (stockInfers.length > 0) {
    const byMode = new Map<string, SkuEntityRow[]>();
    for (const r of stockInfers) {
      const mode = inferFromTitle(trim(r.title))?.stockMode ?? "";
      if (!mode) continue;
      const arr = byMode.get(mode) ?? [];
      arr.push(r);
      byMode.set(mode, arr);
    }
    for (const [mode, rows] of byMode) {
      add({
        kind: "assign_stock_mode",
        titleKey: "dataCleanup.action.assignStock.title",
        reasonKey: "dataCleanup.action.assignStock.reason",
        affectedCount: rows.length,
        confidence: "high",
        previewExamples: rows.map((u) => u.title || u.skuCode).filter(Boolean).slice(0, 4),
        assignValue: mode,
        targetSkuIds: rows.map((u) => u.id),
        vars: { mode, n: String(rows.length) },
      });
    }
  }

  const topCorridor = intel.corridorSummary[0]?.corridor;
  if (topCorridor && topCorridor !== "—") {
    const strong = s.skuEntities.filter((x) => x.completeness === "strong" && trim(x.corridor) === topCorridor);
    if (strong.length > 0) {
      add({
        kind: "mark_hero_candidate",
        titleKey: "dataCleanup.action.hero.title",
        reasonKey: "dataCleanup.action.hero.reason",
        affectedCount: strong.length,
        confidence: "medium",
        previewExamples: strong.map((u) => u.skuCode).slice(0, 4),
        targetSkuIds: strong.map((u) => u.id),
        vars: { corridor: topCorridor, n: String(strong.length) },
      });
    }
  }

  const weak = s.skuEntities.filter((x) => x.completeness === "weak" || x.completeness === "minimal");
  if (weak.length > 0) {
    add({
      kind: "mark_refresh_candidate",
      titleKey: "dataCleanup.action.refresh.title",
      reasonKey: "dataCleanup.action.refresh.reason",
      affectedCount: weak.length,
      confidence: "low",
      previewExamples: weak.map((u) => u.title || u.skuCode).filter(Boolean).slice(0, 4),
      targetSkuIds: weak.map((u) => u.id),
      vars: { n: String(weak.length) },
    });
  }

  add({
    id: "ba_defer_note",
    kind: "ignore_defer",
    titleKey: "dataCleanup.action.defer.title",
    reasonKey: "dataCleanup.action.defer.reason",
    affectedCount: 0,
    confidence: "low",
    previewExamples: [],
    vars: {},
  });

  return actions;
}

export function buildEntityCleanupPlan(snapshot: EntitySnapshot): EntityCleanupPlan {
  const intel = deriveSnapshotIntelligence(snapshot);
  const readinessBefore = snapshotReadinessScore(intel);
  const missingFieldGroups = missingGroupsFromSnapshot(snapshot, intel);
  const suggestedCorridors = corridorSuggestions(snapshot);
  const suggestedProductFamilies = familySuggestions(snapshot);
  const suggestedSeoClusters = seoSuggestions(snapshot);
  const batchActions = buildBatchActions(snapshot, intel);
  const readinessAfterEstimate = estimateAfterApply(
    readinessBefore,
    batchActions.filter((a) => a.kind !== "ignore_defer"),
  );

  const affectedSku = new Set<string>();
  const affectedCard = new Set<string>();
  for (const a of batchActions) {
    for (const id of a.targetSkuIds ?? []) affectedSku.add(id);
    for (const id of a.targetCardIds ?? []) affectedCard.add(id);
  }

  return {
    id: newPlanId(),
    sourceSnapshotId: snapshot.id,
    createdAt: Date.now(),
    missingFieldGroups,
    suggestedCorridors,
    suggestedProductFamilies,
    suggestedSeoClusters,
    batchActions,
    affectedSkuCount: affectedSku.size,
    affectedCardCount: affectedCard.size,
    readinessBefore,
    readinessAfterEstimate,
    warnings: [...snapshot.warnings],
  };
}
