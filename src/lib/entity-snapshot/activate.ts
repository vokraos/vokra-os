import type {
  CardEntityRow,
  EntitySnapshot,
  EntitySnapshotImportType,
  EntitySnapshotWarning,
  SkuEntityCompleteness,
  SkuEntityRow,
} from "./types";
import { ENTITY_SNAPSHOT_SCHEMA } from "./types";

function trim(s: unknown): string {
  if (s == null) return "";
  return String(s).trim();
}

function newSnapshotId(): string {
  return `es_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function bucketMarketplace(mp: string): string {
  const s = mp.toLowerCase();
  if (!s) return "unknown";
  if (s.includes("ozon")) return "ozon";
  if (s.includes("wb") || s.includes("wildberries") || s.includes("вайлд")) return "wb";
  return "other";
}

function completenessForRow(row: Record<string, string>): SkuEntityCompleteness {
  const code = trim(row.skuCode) || trim(row.article);
  if (!code) return "minimal";
  const corridor = trim(row.corridor) || trim(row.seoCluster);
  const extras = [trim(row.marketplace), corridor, trim(row.title) || trim(row["skuName"]), trim(row.productFamily)].filter(Boolean).length;
  if (extras >= 3) return "strong";
  if (extras >= 1) return "weak";
  return "minimal";
}

function missingSkuFields(row: Record<string, string>): string[] {
  const miss: string[] = [];
  if (!trim(row.skuCode) && !trim(row.article)) miss.push("skuCode");
  if (!trim(row.marketplace)) miss.push("marketplace");
  if (!trim(row.corridor) && !trim(row.seoCluster)) miss.push("corridor");
    if (!trim(row.title) && !trim(row["skuName"])) miss.push("title");
  if (!trim(row.warehouse)) miss.push("warehouse");
  if (!trim(row.stockMode)) miss.push("stockMode");
  return miss;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function inc(map: Record<string, number>, key: string, by = 1) {
  const k = key || "unknown";
  map[k] = (map[k] ?? 0) + by;
}

/**
 * Builds a new EntitySnapshot from normalized manual-import rows (already field-mapped).
 */
export function activateEntitySnapshotFromImport(input: {
  normalizedRows: readonly Readonly<Record<string, string>>[];
  importType: EntitySnapshotImportType;
  sourceImportId: string;
}): EntitySnapshot {
  const now = Date.now();
  const rows = input.normalizedRows.map((r) => ({ ...r }));
  const skuEntities: SkuEntityRow[] = [];
  const cardEntities: CardEntityRow[] = [];
  const marketplaceCounts: Record<string, number> = {};
  const stockModeCounts: Record<string, number> = {};
  const warnings: EntitySnapshotWarning[] = [];

  let missingSkuRows = 0;
  let unknownMpHeavy = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const skuCode = trim(row.skuCode) || trim(row.article);
    if (!skuCode) missingSkuRows++;

    const marketplace = trim(row.marketplace);
    const mpBucket = bucketMarketplace(marketplace);
    inc(marketplaceCounts, mpBucket);
    if (mpBucket === "unknown" || mpBucket === "other") unknownMpHeavy++;

    const stockMode = trim(row.stockMode) || "—";
    inc(stockModeCounts, stockMode || "—");

    const corridor = trim(row.corridor) || trim(row.seoCluster);
    const completeness = completenessForRow(row);
    skuEntities.push({
      id: `sku:${i}:${skuCode || "anon"}`,
      skuCode: trim(row.skuCode) || trim(row.article),
      article: trim(row.article),
      marketplace: mpBucket,
      stockMode: trim(row.stockMode),
      corridor,
      productFamily: trim(row.productFamily),
      title: trim(row.title) || trim(row["skuName"]),
      size: trim(row.size),
      color: trim(row.color),
      warehouse: trim(row.warehouse),
      completeness,
      missingFields: missingSkuFields(row),
    });

    const cardTitle = trim(row.cardTitle);
    const includeCard = input.importType === "manual_card_list" || Boolean(cardTitle);
    if (includeCard) {
      const wh = trim(row.warehouse);
      const heroField = trim(row.title) || trim(row["skuName"]) || cardTitle;
      cardEntities.push({
        id: `card:${i}:${skuCode || "anon"}`,
        skuCode: skuCode || `row_${i}`,
        cardTitle: cardTitle || trim(row.title) || trim(row["skuName"]) || "—",
        seoCluster: trim(row.seoCluster),
        marketplace: mpBucket,
        corridor,
        missingHero: !heroField,
        missingSeo: !trim(row.seoCluster),
        missingWarehouse: !wh,
      });
    }
  }

  const corridors = uniqueSorted(rows.map((r) => trim(r.corridor) || trim(r.seoCluster)));
  const productFamilies = uniqueSorted(rows.map((r) => trim(r.productFamily)));
  const seoClusters = uniqueSorted(rows.map((r) => trim(r.seoCluster)));

  if (missingSkuRows > 0) {
    warnings.push({
      id: "missing_sku",
      labelKey: "entitySnap.warn.missingSkuRows",
      detail: String(missingSkuRows),
    });
  }
  if (rows.length > 0 && unknownMpHeavy / rows.length > 0.55) {
    warnings.push({ id: "mp_unknown", labelKey: "entitySnap.warn.marketplaceAmbiguous" });
  }
  if (rows.length === 0) {
    warnings.push({ id: "empty", labelKey: "entitySnap.warn.emptyActivation" });
  }

  return {
    schema: ENTITY_SNAPSHOT_SCHEMA,
    id: newSnapshotId(),
    sourceImportId: input.sourceImportId,
    importType: input.importType,
    createdAt: now,
    updatedAt: now,
    rowCountIncluded: rows.length,
    skuEntities,
    cardEntities,
    corridors,
    productFamilies,
    seoClusters,
    marketplaceCounts,
    stockModeCounts,
    warnings,
  };
}
