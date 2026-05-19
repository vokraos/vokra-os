import type { WbOperationalFetchResult } from "./types";

function trim(s: unknown): string {
  if (s == null) return "";
  return String(s).trim();
}

function rowKey(nmId?: number, supplierArticle?: string): string {
  const art = trim(supplierArticle);
  if (art) return `art:${art}`;
  if (nmId != null && nmId > 0) return `nm:${nmId}`;
  return "";
}

type Agg = {
  nmId?: number;
  supplierArticle: string;
  title: string;
  warehouse: string;
  stockMode: string;
  corridor: string;
  productFamily: string;
  stock: number;
  orders: number;
  sales: number;
};

/**
 * Maps WB Statistics API payloads into manual-import row shape for entity-snapshot activation.
 */
export function normalizeWbOperationalData(data: WbOperationalFetchResult): Record<string, string>[] {
  const map = new Map<string, Agg>();

  function ensure(key: string, seed: Partial<Agg>): Agg {
    let row = map.get(key);
    if (!row) {
      row = {
        supplierArticle: seed.supplierArticle ?? "",
        nmId: seed.nmId,
        title: seed.title ?? "",
        warehouse: seed.warehouse ?? "",
        stockMode: seed.stockMode ?? "",
        corridor: seed.corridor ?? "",
        productFamily: seed.productFamily ?? "",
        stock: 0,
        orders: 0,
        sales: 0,
      };
      map.set(key, row);
    }
    return row;
  }

  for (const s of data.stocks) {
    const key = rowKey(s.nmId, s.supplierArticle);
    if (!key) continue;
    const row = ensure(key, {
      nmId: s.nmId,
      supplierArticle: trim(s.supplierArticle),
      title: trim(s.subject) || trim(s.brand),
      warehouse: trim(s.warehouseName),
      corridor: trim(s.subject),
      productFamily: trim(s.brand),
    });
    row.stock += Number(s.quantity ?? s.quantityFull ?? 0) || 0;
    if (!row.warehouse && trim(s.warehouseName)) row.warehouse = trim(s.warehouseName);
  }

  for (const o of data.orders) {
    if (o.isCancel) continue;
    const key = rowKey(o.nmId, o.supplierArticle);
    if (!key) continue;
    const row = ensure(key, {
      nmId: o.nmId,
      supplierArticle: trim(o.supplierArticle),
      title: trim(o.subject) || trim(o.brand),
      warehouse: trim(o.warehouseName),
      stockMode: trim(o.warehouseType),
      corridor: trim(o.category) || trim(o.subject),
      productFamily: trim(o.brand),
    });
    row.orders += 1;
  }

  for (const s of data.sales) {
    if (s.isStorno) continue;
    const key = rowKey(s.nmId, s.supplierArticle);
    if (!key) continue;
    const row = ensure(key, {
      nmId: s.nmId,
      supplierArticle: trim(s.supplierArticle),
      title: trim(s.subject) || trim(s.brand),
      warehouse: trim(s.warehouseName),
      corridor: trim(s.category) || trim(s.subject),
      productFamily: trim(s.brand),
    });
    row.sales += 1;
  }

  const rows: Record<string, string>[] = [];
  for (const agg of map.values()) {
    const skuCode = agg.supplierArticle || (agg.nmId != null ? String(agg.nmId) : "");
    if (!skuCode) continue;
    rows.push({
      skuCode,
      article: agg.supplierArticle,
      nmId: agg.nmId != null ? String(agg.nmId) : "",
      marketplace: "wb",
      title: agg.title,
      skuName: agg.title,
      warehouse: agg.warehouse,
      stockMode: agg.stockMode || (agg.stock > 0 ? "fbo" : ""),
      corridor: agg.corridor,
      productFamily: agg.productFamily,
      stock: String(agg.stock),
      orders: String(agg.orders),
      buyouts: String(agg.sales),
    });
  }

  return rows;
}
