import type { SkuEntityRow } from "../../entity-snapshot/types";
import type { AssortmentActionType, AssortmentActionCategory, AssortmentActionPriority } from "../types";

function trim(s: string): string {
  return (s ?? "").trim();
}

/** Count of SKU codes that appear on more than one row (structural duplicate risk). */
export function duplicateCodeClusters(skus: SkuEntityRow[]): number {
  const by = new Map<string, number>();
  for (const s of skus) {
    const k = trim(s.skuCode) || trim(s.article);
    if (!k) continue;
    by.set(k, (by.get(k) ?? 0) + 1);
  }
  let n = 0;
  for (const c of by.values()) {
    if (c > 1) n += 1;
  }
  return n;
}

export function computeOperationalRisk(args: {
  actionType: AssortmentActionType;
  category: AssortmentActionCategory;
  priority: AssortmentActionPriority;
  marketplace?: string;
  duplicateClusters: number;
  titleKey: string;
}): number {
  const { actionType, category, priority, marketplace, duplicateClusters, titleKey } = args;
  let score = 22;

  if (duplicateClusters > 0) {
    score += Math.min(36, 10 + duplicateClusters * 3);
    if (titleKey.includes("dup") || titleKey.includes("overlap") || actionType === "split_marketplace_group") {
      score += 12;
    }
  }

  if (actionType === "split_marketplace_group") score += 22;
  if (category === "risk") score += 14;
  if (priority === "critical") score += 10;

  const mp = (marketplace ?? "").toLowerCase();
  if (!mp || mp === "unknown" || mp === "—") score += 16;

  if (actionType === "archive_weak_sku") score += 8;

  return Math.round(Math.min(100, Math.max(5, score)));
}
