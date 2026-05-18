import { ENTITY_SNAPSHOT_SCHEMA, type CardEntityRow, type EntitySnapshot, type SkuEntityRow } from "../types";
import { deriveSnapshotIntelligence } from "../intelligence";
import { snapshotReadinessScore } from "./readiness";
import type { CleanupBatchAction, EntityCleanupPlan } from "./types";

function newSnapshotId(): string {
  return `es_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function trim(s: string): string {
  return (s ?? "").trim();
}

function skuCompleteness(s: SkuEntityRow): SkuEntityRow["completeness"] {
  const code = trim(s.skuCode) || trim(s.article);
  if (!code) return "minimal";
  const corridor = trim(s.corridor);
  const extras = [
    s.marketplace && s.marketplace !== "unknown" ? s.marketplace : "",
    corridor,
    trim(s.title),
    trim(s.productFamily),
  ].filter(Boolean).length;
  if (extras >= 3) return "strong";
  if (extras >= 1) return "weak";
  return "minimal";
}

function skuMissingFields(s: SkuEntityRow): string[] {
  const miss: string[] = [];
  if (!trim(s.skuCode) && !trim(s.article)) miss.push("skuCode");
  if (!s.marketplace || s.marketplace === "unknown") miss.push("marketplace");
  const cor = trim(s.corridor);
  if (!cor || cor === "—") miss.push("corridor");
  if (!trim(s.title)) miss.push("title");
  if (!trim(s.warehouse)) miss.push("warehouse");
  if (!trim(s.stockMode)) miss.push("stockMode");
  if (!trim(s.productFamily)) miss.push("productFamily");
  return miss;
}

function refreshSku(s: SkuEntityRow): SkuEntityRow {
  const missingFields = skuMissingFields(s);
  return { ...s, missingFields, completeness: skuCompleteness(s) };
}

function refreshCard(c: CardEntityRow, skuByCode: Map<string, SkuEntityRow>): CardEntityRow {
  const sku = skuByCode.get(c.skuCode);
  const heroField = trim(sku?.title ?? "") || trim(c.cardTitle);
  const wh = trim(sku?.warehouse ?? "");
  return {
    ...c,
    corridor: trim(c.corridor) || trim(sku?.corridor ?? "") || c.corridor,
    marketplace: trim(c.marketplace) && c.marketplace !== "unknown" ? c.marketplace : sku?.marketplace ?? c.marketplace,
    missingHero: !heroField,
    missingSeo: !trim(c.seoCluster),
    missingWarehouse: !wh,
  };
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function inc(map: Record<string, number>, key: string, by = 1) {
  const k = key || "unknown";
  map[k] = (map[k] ?? 0) + by;
}

function rebuildDerived(snapshot: EntitySnapshot): EntitySnapshot {
  const skuEntities = snapshot.skuEntities.map(refreshSku);
  const skuByCode = new Map(skuEntities.map((s) => [s.skuCode || s.article, s] as const));

  const cardEntities = snapshot.cardEntities.map((c) => refreshCard(c, skuByCode));

  const marketplaceCounts: Record<string, number> = {};
  const stockModeCounts: Record<string, number> = {};
  for (const s of skuEntities) {
    inc(marketplaceCounts, s.marketplace || "unknown");
    inc(stockModeCounts, trim(s.stockMode) || "—");
  }

  const corridors = uniqueSorted([
    ...skuEntities.map((s) => trim(s.corridor)),
    ...cardEntities.map((c) => trim(c.corridor)),
  ]);
  const productFamilies = uniqueSorted(skuEntities.map((s) => trim(s.productFamily)));
  const seoClusters = uniqueSorted(cardEntities.map((c) => trim(c.seoCluster)));

  return {
    ...snapshot,
    skuEntities,
    cardEntities,
    corridors,
    productFamilies,
    seoClusters,
    marketplaceCounts,
    stockModeCounts,
    updatedAt: Date.now(),
  };
}

function applyOneAction(
  snapshot: EntitySnapshot,
  action: CleanupBatchAction,
): EntitySnapshot {
  let skuEntities = snapshot.skuEntities.map((s) => ({ ...s }));
  let cardEntities = snapshot.cardEntities.map((c) => ({ ...c }));

  const skuById = new Map(skuEntities.map((s) => [s.id, s] as const));
  const cardById = new Map(cardEntities.map((c) => [c.id, c] as const));

  const patchSku = (id: string, patch: Partial<SkuEntityRow>) => {
    const cur = skuById.get(id);
    if (!cur) return;
    const next = { ...cur, ...patch };
    skuById.set(id, next);
  };

  const patchCard = (id: string, patch: Partial<CardEntityRow>) => {
    const cur = cardById.get(id);
    if (!cur) return;
    const next = { ...cur, ...patch };
    cardById.set(id, next);
  };

  const codesFromSkuTargets = new Set<string>();
  for (const id of action.targetSkuIds ?? []) {
    const s = skuById.get(id);
    if (s) codesFromSkuTargets.add(s.skuCode || s.article);
  }

  switch (action.kind) {
    case "ignore_defer":
      return snapshot;
    case "assign_corridor": {
      const v = trim(action.assignValue ?? "");
      if (!v) return snapshot;
      for (const id of action.targetSkuIds ?? []) {
        patchSku(id, { corridor: v });
      }
      for (const c of [...cardById.values()]) {
        if (codesFromSkuTargets.has(c.skuCode)) {
          patchCard(c.id, { corridor: v });
        }
      }
      break;
    }
    case "assign_product_family": {
      const v = trim(action.assignValue ?? "");
      if (!v) return snapshot;
      for (const id of action.targetSkuIds ?? []) patchSku(id, { productFamily: v });
      break;
    }
    case "assign_seo_cluster": {
      const v = trim(action.assignValue ?? "");
      if (!v) return snapshot;
      for (const id of action.targetCardIds ?? []) {
        patchCard(id, { seoCluster: v, missingSeo: false });
      }
      break;
    }
    case "assign_marketplace":
    case "split_mixed_group": {
      const v = trim(action.assignValue ?? "") as "wb" | "ozon";
      if (v !== "wb" && v !== "ozon") return snapshot;
      for (const id of action.targetSkuIds ?? []) {
        patchSku(id, { marketplace: v });
      }
      for (const c of [...cardById.values()]) {
        if (codesFromSkuTargets.has(c.skuCode) && (c.marketplace === "unknown" || !trim(c.marketplace))) {
          patchCard(c.id, { marketplace: v });
        }
      }
      break;
    }
    case "assign_stock_mode": {
      const v = trim(action.assignValue ?? "");
      if (!v) return snapshot;
      for (const id of action.targetSkuIds ?? []) patchSku(id, { stockMode: v });
      break;
    }
    case "mark_hero_candidate": {
      for (const id of action.targetSkuIds ?? []) patchSku(id, { heroCandidate: true });
      for (const c of [...cardById.values()]) {
        if (codesFromSkuTargets.has(c.skuCode)) patchCard(c.id, { heroCandidate: true });
      }
      break;
    }
    case "mark_refresh_candidate": {
      for (const id of action.targetSkuIds ?? []) patchSku(id, { refreshCandidate: true });
      for (const c of [...cardById.values()]) {
        if (codesFromSkuTargets.has(c.skuCode)) patchCard(c.id, { refreshCandidate: true });
      }
      break;
    }
    default:
      return snapshot;
  }

  skuEntities = [...skuById.values()];
  cardEntities = [...cardById.values()];
  return rebuildDerived({ ...snapshot, skuEntities, cardEntities });
}

/**
 * Applies selected cleanup actions into a **new** snapshot; keeps `previousSnapshotId` and appends history.
 */
export function applyEntityCleanup(args: {
  snapshot: EntitySnapshot;
  plan: EntityCleanupPlan;
  selectedActionIds: readonly string[];
}): { next: EntitySnapshot; applied: CleanupBatchAction[]; readinessAfter: number } {
  const { snapshot, plan, selectedActionIds } = args;
  const selected = new Set(selectedActionIds);
  const actions = plan.batchActions.filter((a) => selected.has(a.id) && a.kind !== "ignore_defer");

  let cur = { ...snapshot, skuEntities: snapshot.skuEntities.map((s) => ({ ...s })), cardEntities: snapshot.cardEntities.map((c) => ({ ...c })) };
  const applied: CleanupBatchAction[] = [];

  for (const a of actions) {
    const before = JSON.stringify(cur);
    cur = applyOneAction(cur, a);
    if (JSON.stringify(cur) !== before) {
      applied.push({ ...a, status: "applied" });
    }
  }

  const prevId = snapshot.id;
  const history = [...(snapshot.enrichmentHistory ?? [])];
  const intelAfter = deriveSnapshotIntelligence(cur);
  const ra = snapshotReadinessScore(intelAfter);

  history.push({
    appliedAt: Date.now(),
    planId: plan.id,
    appliedActionIds: applied.map((x) => x.id),
    readinessBefore: plan.readinessBefore,
    readinessAfter: ra,
  });

  const next: EntitySnapshot = {
    ...rebuildDerived(cur),
    id: newSnapshotId(),
    createdAt: snapshot.createdAt,
    previousSnapshotId: prevId,
    enrichmentHistory: history,
    schema: ENTITY_SNAPSHOT_SCHEMA,
  };

  return { next, applied, readinessAfter: ra };
}
