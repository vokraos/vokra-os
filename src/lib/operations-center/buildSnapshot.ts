import type { MemorySnapshot } from "../memory/types";
import type {
  GrowthOpportunity,
  KpiRadarAxis,
  ManualOperationalBrief,
  MemoryDerivedSignals,
  OperationsCenterSnapshot,
  PriorityAction,
  ProductionPressure,
  RiskWarning,
  SkuHeatCell,
  WithProvenance,
} from "./types";
import { OPERATIONS_CENTER_SCHEMA_VERSION } from "./types";
import { deriveMemorySignals } from "./memorySignals";
import { loadManualBrief } from "./manualStore";
import { buildOperationalAlerts } from "./alerts";
import { buildRecommendations } from "./recommendations";
import { computeMarketplaceHealth, computeOperationalScore } from "./scoring";
import { defaultExternalFeeds } from "./placeholders";

function w<T>(value: T, provenance: WithProvenance<T>["provenance"], detailKey?: string): WithProvenance<T> {
  return { value, provenance, detailKey };
}

function buildKpiRadar(mem: MemoryDerivedSignals, manual: ManualOperationalBrief): KpiRadarAxis[] {
  const skuScore = mem.skuCount.value === 0 ? 22 : Math.min(100, 40 + mem.skuCount.value * 6);
  const stockProxy = mem.skuCount.value > 8 ? 58 : mem.skuCount.value > 0 ? 48 : 25;
  const ads = manual.adLoadManual ?? 44;
  const ctrProxy = Math.min(100, 30 + mem.visualAnalysisCount.value * 8);
  const crProxy = Math.min(100, 28 + mem.generationCount30d.value * 5);
  const trend = Math.min(100, 35 + mem.uniqueCategories.value * 4);

  return [
    { id: "sku", labelKey: "operations.radar.sku", score: w(Math.round(skuScore), "inferred", "operations.provenance.inferredModel") },
    { id: "stock", labelKey: "operations.radar.stock", score: w(stockProxy, "estimated", "operations.provenance.estimatedBand") },
    { id: "ads", labelKey: "operations.radar.ads", score: w(Math.round(ads), manual.adLoadManual != null ? "manual" : "estimated") },
    { id: "ctr", labelKey: "operations.radar.ctr", score: w(Math.round(ctrProxy), "inferred", "operations.provenance.inferredModel") },
    { id: "cr", labelKey: "operations.radar.cr", score: w(Math.round(crProxy), "inferred", "operations.provenance.inferredModel") },
    { id: "trend", labelKey: "operations.radar.trend", score: w(Math.round(trend), "memory-derived") },
  ];
}

function buildSkuHeatmap(snap: MemorySnapshot, projectId: string | null): SkuHeatCell[] {
  if (!projectId) return [];
  const proj = snap.projects[projectId];
  if (!proj) return [];
  const cells: SkuHeatCell[] = [];
  for (const sid of proj.skuIds) {
    const s = snap.skus[sid];
    if (!s) continue;
    const linkW = s.linkedGenerationIds.length + s.linkedVisualAnalysisIds.length * 2;
    const tier: SkuHeatCell["tier"] = linkW >= 6 ? "winner" : linkW <= 1 ? "loser" : "neutral";
    const intensity = Math.min(100, 18 + linkW * 9 + (s.updatedAt > Date.now() - 14 * 86_400_000 ? 12 : 0));
    cells.push({
      skuId: s.id,
      label: s.name,
      category: s.category || "—",
      intensity: w(
        Math.round(intensity),
        "inferred",
        linkW === 0 ? "operations.provenance.inferredWeakSignal" : "operations.provenance.inferredModel",
      ),
      tier,
    });
  }
  return cells.slice(0, 48);
}

function buildGrowth(mem: MemoryDerivedSignals): GrowthOpportunity[] {
  const g: GrowthOpportunity[] = [];
  if (mem.visualAnalysisCount.value > 0) {
    g.push({
      id: "go_visual_scale",
      titleKey: "operations.growth.visualScale.title",
      bodyKey: "operations.growth.visualScale.body",
      provenance: "inferred",
    });
  }
  g.push({
    id: "go_marketplace_api",
    titleKey: "operations.growth.api.title",
    bodyKey: "operations.growth.api.body",
    provenance: "estimated",
  });
  return g;
}

function buildRisks(mem: MemoryDerivedSignals, manual: ManualOperationalBrief): RiskWarning[] {
  const rw: RiskWarning[] = [];
  if (mem.skuCount.value > 12) {
    rw.push({
      id: "rw_sku_breadth",
      titleKey: "operations.risk.skuBreadth.title",
      bodyKey: "operations.risk.skuBreadth.body",
      severity: "watch",
      provenance: "memory-derived",
    });
  }
  if (manual.categoryOverloadManual != null && manual.categoryOverloadManual > 72) {
    rw.push({
      id: "rw_cat_manual",
      titleKey: "operations.risk.catOverload.title",
      bodyKey: "operations.risk.catOverload.body",
      severity: "risk",
      provenance: "manual",
    });
  }
  rw.push({
    id: "rw_placeholder_data",
    titleKey: "operations.risk.placeholder.title",
    bodyKey: "operations.risk.placeholder.body",
    severity: "info",
    provenance: "estimated",
  });
  return rw;
}

function buildProductionPressure(manual: ManualOperationalBrief): ProductionPressure {
  const manualV = manual.productionPressureManual;
  const score =
    manualV != null
      ? manualV
      : manual.productionBottleneckNote.trim().length > 0
        ? 55
        : 38;
  return {
    score: w(
      Math.round(score),
      manualV != null ? "manual" : manual.productionBottleneckNote.trim() ? "inferred" : "estimated",
      manualV != null ? undefined : "operations.provenance.estimatedBand",
    ),
    bottleneckSummaryKey:
      manual.productionBottleneckNote.trim().length > 0
        ? "operations.prod.bottleneckFromManual"
        : "operations.prod.bottleneckGeneric",
  };
}

function buildPulse(mem: MemoryDerivedSignals): import("./types").MarketplacePulse {
  const vis = mem.visualAnalysisCount.value;
  const band: import("./types").MarketplacePulse["visibilityBand"]["value"] =
    vis >= 4 ? "high" : vis >= 1 ? "mid" : "low";
  return {
    headlineKey: "operations.pulse.headline",
    channels: defaultExternalFeeds(),
    visibilityBand: w(band, "inferred", "operations.provenance.inferredModel"),
    seasonalityKey: "operations.pulse.seasonality",
    trendDriftKey: "operations.pulse.trendDrift",
  };
}

function buildPriorityActions(
  mem: MemoryDerivedSignals,
  manual: ManualOperationalBrief,
): PriorityAction[] {
  const actions: PriorityAction[] = [];
  let rank = 1;
  if (mem.skuCount.value === 0) {
    actions.push({
      id: "pa_skus",
      rank: rank++,
      labelKey: "operations.priority.defineSkus",
      provenance: "memory-derived",
    });
  }
  if (manual.runwayNotes.trim().length === 0) {
    actions.push({
      id: "pa_runway",
      rank: rank++,
      labelKey: "operations.priority.runwayBrief",
      provenance: "manual",
    });
  }
  actions.push({
    id: "pa_connect",
    rank: rank++,
    labelKey: "operations.priority.planIntegrations",
    provenance: "estimated",
  });
  return actions;
}

export type BuildOperationsInput = {
  memorySnapshot: MemorySnapshot;
  activeProjectId: string | null;
  manualOverride?: ManualOperationalBrief;
};

export function buildOperationsCenterSnapshot(input: BuildOperationsInput): OperationsCenterSnapshot {
  const manual = input.manualOverride ?? loadManualBrief();
  const mem = deriveMemorySignals(input.memorySnapshot, input.activeProjectId);
  const operationalScore = computeOperationalScore(mem, manual);
  const marketplaceHealth = computeMarketplaceHealth(mem, manual);
  const alerts = buildOperationalAlerts(mem, manual);
  const recommendations = buildRecommendations(mem, manual);
  const kpiRadar = buildKpiRadar(mem, manual);
  const skuHeatmap = buildSkuHeatmap(input.memorySnapshot, input.activeProjectId);
  const growthOpportunities = buildGrowth(mem);
  const riskWarnings = buildRisks(mem, manual);
  const productionPressure = buildProductionPressure(manual);
  const marketplacePulse = buildPulse(mem);
  const priorityActions = buildPriorityActions(mem, manual);

  return {
    schemaVersion: OPERATIONS_CENTER_SCHEMA_VERSION,
    computedAt: Date.now(),
    memory: mem,
    manual,
    operationalScore,
    marketplaceHealth,
    alerts,
    recommendations,
    kpiRadar,
    skuHeatmap,
    growthOpportunities,
    riskWarnings,
    productionPressure,
    marketplacePulse,
    priorityActions,
  };
}
