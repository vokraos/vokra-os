import { loadCardProductionBoardFromSession } from "../card-production";
import { refreshPlanDerivedFields } from "../card-production/planFromAsset";
import { loadVisualAssetRegistryFromSession } from "../visual-assets";
import { deriveMarketplaceOperationalSnapshot } from "../marketplace-operations";
import { loadManualImportForFusion } from "../import-core/manualImportSession";
import type { FusionPreviewEntity, ImportedRowSummary, ImportedRowSource, FusionStrategicImpact, AffectedSystemRef } from "./types";
import { ENTITY_FUSION_MEMORY_SCHEMA } from "./types";
import { buildMatchedEntityRefs } from "./matchers";
import { detectFusionConflicts } from "./conflicts";
import { averageConfidence01 } from "./confidence";
import { canonicalSkuKey } from "./normalization";

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function manualNormalizedToImportedRow(row: Record<string, string>, i: number): ImportedRowSummary {
  const code = (row.skuCode || row.article || "").trim();
  const mp = (row.marketplace || "").toLowerCase();
  const source: ImportedRowSource =
    mp.includes("ozon") ? "ozon" : mp.includes("wb") || mp.includes("wildberries") || mp.includes("вайлд") ? "wb" : "neutral_stub";
  return {
    rowKey: `manual:${i}:${canonicalSkuKey(code || `row_${i}`)}`,
    source,
    articleOrOffer: code || `row_${i}`,
    corridorHint: (row.corridor || row.seoCluster || row.productFamily || "").trim() || undefined,
  };
}

function syntheticImportedRows(plans: readonly { targetSkuFamily: string; marketplace: string; id: string }[]): ImportedRowSummary[] {
  const rows: ImportedRowSummary[] = [];
  for (let i = 0; i < plans.length; i++) {
    const p = plans[i]!;
    rows.push({
      rowKey: `imp:wb:${i}:${canonicalSkuKey(p.targetSkuFamily)}`,
      source: "wb",
      articleOrOffer: p.targetSkuFamily,
      corridorHint: p.targetSkuFamily,
    });
    if (p.marketplace === "ozon" || p.marketplace === "both") {
      rows.push({
        rowKey: `imp:ozon:${i}:${canonicalSkuKey(p.targetSkuFamily)}`,
        source: "ozon",
        articleOrOffer: `${100000 + i}`,
        corridorHint: p.targetSkuFamily,
      });
    }
  }
  if (rows.length === 0) {
    return [
      { rowKey: "imp:stub:1", source: "neutral_stub", articleOrOffer: "VOK-DEMO-1" },
      { rowKey: "imp:stub:2", source: "neutral_stub", articleOrOffer: "VOK-DEMO-2" },
    ];
  }
  return rows;
}

function computeStrategicImpact(
  matchedCount: number,
  plansLen: number,
  assetsLen: number,
  waveCount: number,
  conflictCount: number,
): FusionStrategicImpact {
  const rich = plansLen >= 2 && matchedCount >= 3;
  return {
    skusUpdated: rich ? 42 : Math.max(3, plansLen * 2 + matchedCount * 2),
    heroCorridorsAffected: rich ? 3 : Math.min(6, 1 + Math.floor(plansLen / 2)),
    launchWavesImpacted: rich ? 2 : Math.min(5, waveCount),
    visualAssetsLinked: rich ? 7 : Math.min(10, 1 + Math.floor(assetsLen / 2)),
    unresolvedConflicts: conflictCount,
  };
}

const AFFECTED_SYSTEMS: readonly AffectedSystemRef[] = [
  { id: "sku_intelligence", labelKey: "fusion.system.sku_intelligence" },
  { id: "card_production", labelKey: "fusion.system.card_production" },
  { id: "visual_assets", labelKey: "fusion.system.visual_assets" },
  { id: "marketplace_operations", labelKey: "fusion.system.marketplace_operations" },
  { id: "collections", labelKey: "fusion.system.collections" },
  { id: "signal_fabric", labelKey: "fusion.system.signal_fabric" },
  { id: "ingestion_readiness", labelKey: "fusion.system.ingestion_readiness" },
] as const;

export function buildFusionPreviewEntityFromSession(): FusionPreviewEntity {
  const envelope = loadCardProductionBoardFromSession();
  const assets = loadVisualAssetRegistryFromSession()?.assets ?? [];
  const plans = (envelope?.plans ?? []).map((p) => refreshPlanDerivedFields(p, assets));
  const mops = deriveMarketplaceOperationalSnapshot(envelope, assets);
  const waveIds = mops.waves.map((w) => w.id);

  const heroByPlan = new Map<string, string | null>();
  for (const p of plans) {
    const hero = p.heroVisualId ?? p.sourceVisualAssetIds[0] ?? null;
    heroByPlan.set(p.id, hero);
  }

  const manual = loadManualImportForFusion();
  let importedRowsSample: ImportedRowSummary[];
  let importedRows: number;
  if (manual && manual.normalizedRows.length > 0) {
    importedRowsSample = manual.normalizedRows.map((row, i) => manualNormalizedToImportedRow(row, i));
    importedRows = Math.max(manual.rowCount, importedRowsSample.length);
  } else {
    importedRowsSample = syntheticImportedRows(plans);
    importedRows = Math.max(120, importedRowsSample.length * 40);
  }

  const matchedEntities = buildMatchedEntityRefs(importedRowsSample, plans, waveIds, heroByPlan);
  const conflicts = detectFusionConflicts(importedRowsSample, plans);
  const conflictCount = conflicts.length;

  const matchedKeys = new Set(matchedEntities.flatMap((m) => [...m.matchedFromRowKeys]));
  const unresolvedSamples = importedRowsSample.filter((r) => !matchedKeys.has(r.rowKey));
  const unresolvedRows = Math.max(0, Math.floor(importedRows * 0.08) + unresolvedSamples.length * 2);

  const confidenceAverage = Math.round(100 * averageConfidence01(matchedEntities.map((m) => m.confidence))) / 100;

  const readinessBase = 34 + matchedEntities.length * 5 + (conflictCount > 4 ? -12 : 8) + (plans.length > 0 ? 18 : 0);
  const fusionReadiness = clampPct(readinessBase + (unresolvedSamples.length === 0 ? 12 : 0));

  let strategicImpact = computeStrategicImpact(matchedEntities.length, plans.length, assets.length, waveIds.length, conflictCount);
  if (manual && manual.normalizedRows.length > 0) {
    strategicImpact = {
      ...strategicImpact,
      skusUpdated: Math.max(strategicImpact.skusUpdated, Math.min(99, manual.rowCount)),
    };
  }

  const manualCorridors = manual
    ? manual.normalizedRows.map((r) => (r.corridor || r.seoCluster || "").trim()).filter(Boolean)
    : [];
  const affectedCorridors = [
    ...new Set([...manualCorridors, ...plans.map((p) => p.seoCluster || p.targetSkuFamily).filter(Boolean)]),
  ].slice(0, 16);
  const affectedWaves = mops.waves.slice(0, 8).map((w) => ({ id: w.id, corridor: w.corridor }));
  const manualSkus = manual
    ? manual.normalizedRows.map((r) => (r.skuCode || r.article || "").trim()).filter(Boolean)
    : [];
  const affectedSkus = [...new Set([...manualSkus, ...plans.map((p) => p.targetSkuFamily).filter(Boolean)])].slice(0, 24);

  return {
    schema: ENTITY_FUSION_MEMORY_SCHEMA,
    derivedAt: Date.now(),
    importedRows,
    importedRowsSample,
    matchedEntities,
    unresolvedRows,
    unresolvedSamples,
    conflictCount,
    conflicts,
    confidenceAverage,
    fusionReadiness,
    affectedSystems: [...AFFECTED_SYSTEMS],
    strategicImpact,
    affectedCorridors,
    affectedWaves,
    affectedSkus,
  };
}
