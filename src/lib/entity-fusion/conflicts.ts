import type { CardProductionPlan } from "../card-production/types";
import type { FusionConflict, FusionConflictKind, ImportedRowSummary } from "./types";
import { canonicalCorridorSlug, canonicalSkuKey } from "./normalization";

export function detectFusionConflicts(
  rows: readonly ImportedRowSummary[],
  plans: readonly CardProductionPlan[],
): FusionConflict[] {
  const out: FusionConflict[] = [];
  let seq = 0;
  const nid = (prefix: string) => {
    seq += 1;
    return `${prefix}_${seq}`;
  };
  const skuCounts = new Map<string, number>();
  for (const r of rows) {
    const k = canonicalSkuKey(r.articleOrOffer);
    skuCounts.set(k, (skuCounts.get(k) ?? 0) + 1);
  }
  for (const [k, n] of skuCounts) {
    if (n > 1) {
      out.push({
        id: nid("dup_sku"),
        kind: "duplicate_sku",
        severity: "mid",
        labelKey: "fusion.conflict.duplicate_sku",
        relatedRowKeys: rows.filter((r) => canonicalSkuKey(r.articleOrOffer) === k).map((r) => r.rowKey),
      });
    }
  }

  const corridors = new Map<string, string[]>();
  for (const p of plans) {
    const slug = canonicalCorridorSlug(p.seoCluster || p.targetSkuFamily);
    const arr = corridors.get(slug) ?? [];
    arr.push(p.id);
    corridors.set(slug, arr);
  }
  for (const [, ids] of corridors) {
    if (ids.length > 2) {
      out.push({
        id: nid("corridor"),
        kind: "conflicting_corridor",
        severity: "high",
        labelKey: "fusion.conflict.conflicting_corridor",
        relatedRowKeys: rows.slice(0, 2).map((r) => r.rowKey),
      });
      break;
    }
  }

  for (const p of plans) {
    if (!p.heroVisualId && p.sourceVisualAssetIds.length === 0) {
      out.push({
        id: nid("hero"),
        kind: "unresolved_hero",
        severity: "mid",
        labelKey: "fusion.conflict.unresolved_hero",
        relatedRowKeys: [p.id],
      });
      break;
    }
  }

  if (rows.length > 0 && plans.length === 0) {
    out.push({
      id: nid("map"),
      kind: "missing_mapping",
      severity: "high",
      labelKey: "fusion.conflict.missing_mapping",
      relatedRowKeys: rows.map((r) => r.rowKey).slice(0, 4),
    });
  }

  for (const p of plans) {
    if (p.cardStatus === "blocked" && p.blockers.length > 0) {
      out.push({
        id: nid("orphan"),
        kind: "orphan_card",
        severity: "low",
        labelKey: "fusion.conflict.orphan_card",
        relatedRowKeys: [p.id],
      });
      break;
    }
  }

  out.push({
    id: nid("visual_own"),
    kind: "multiple_visual_ownership",
    severity: "low",
    labelKey: "fusion.conflict.multiple_visual_ownership",
    relatedRowKeys: rows.slice(0, 1).map((r) => r.rowKey),
  });

  out.push({
    id: nid("stale"),
    kind: "stale_operational_state",
    severity: "low",
    labelKey: "fusion.conflict.stale_operational_state",
    relatedRowKeys: [],
  });

  return dedupeConflicts(out);
}

function dedupeConflicts(list: FusionConflict[]): FusionConflict[] {
  const seen = new Set<FusionConflictKind>();
  const out: FusionConflict[] = [];
  for (const c of list) {
    if (seen.has(c.kind)) continue;
    seen.add(c.kind);
    out.push(c);
  }
  return out;
}
