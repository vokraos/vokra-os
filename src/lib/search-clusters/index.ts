import type { EntitySnapshot } from "../entity-snapshot/types";
import type {
  CompetitiveMapFoundation,
  CompetitiveMapIntegrationHint,
  CompetitorCorridorEntity,
  SearchClusterEntity,
} from "./types";
import { deriveSearchClustersFromSnapshot, getSampleSearchClusters } from "./cluster-derive";
import { applyOverlapRiskToClusters, computeClusterOverlaps } from "./overlap";
import { computeSaturationByClusterId } from "./saturation";
import { deriveCompetitorCorridors, getSampleCompetitorCorridors } from "./competitor-map";
import { computeHeroPressure } from "./hero-pressure";

export type {
  ClusterOverlapEdge,
  CompetitorCorridorEntity,
  CompetitiveMapFoundation,
  CompetitiveMapIntegrationHint,
  CompetitiveMapMemoryPayload,
  HeroPressureSignal,
  SearchClusterEntity,
  SearchClusterType,
} from "./types";
export { COMPETITIVE_MAP_MEMORY_SCHEMA } from "./types";
export { normalizeQuery, deriveSearchClustersFromSnapshot, getSampleSearchClusters, heroPatternsFromTitles } from "./cluster-derive";
export { computeClusterOverlaps, applyOverlapRiskToClusters } from "./overlap";
export { computeSaturationByClusterId } from "./saturation";
export { computeHeroPressure } from "./hero-pressure";
export { deriveCompetitorCorridors, getSampleCompetitorCorridors } from "./competitor-map";
export {
  parseCompetitiveMapMemoryPayload,
  buildCompetitiveMapMemoryPayload,
  saveCompetitiveMapMemoryToSession,
  consumeCompetitiveMapMemoryFromSession,
} from "./memoryPayload";

function linkCorridorClusters(corridors: CompetitorCorridorEntity[], clusters: SearchClusterEntity[]): void {
  for (const cc of corridors) {
    cc.relatedClusters = clusters.filter((c) => c.corridor === cc.corridor).map((c) => c.id);
  }
}

function buildDifferentiationNoteKeys(clusters: SearchClusterEntity[], corridors: CompetitorCorridorEntity[]): string[] {
  const s = new Set<string>();
  for (const cc of corridors) s.add(cc.differentiationGap);
  for (const cl of clusters) {
    if (cl.estimatedCompetition < 40) s.add("cmap.diff.pocket_low_pressure");
    if (cl.saturationLevel >= 70) s.add("cmap.diff.corridor_refresh");
  }
  return [...s];
}

function buildIntegrationHints(
  clusters: SearchClusterEntity[],
  corridors: CompetitorCorridorEntity[],
  sourceSnapshotId: string | null,
): CompetitiveMapIntegrationHint[] {
  const hints: CompetitiveMapIntegrationHint[] = [];
  const topBySat = [...clusters].sort((a, b) => b.saturationLevel - a.saturationLevel)[0];
  if (topBySat && topBySat.saturationLevel >= 58) {
    hints.push({
      messageKey: "cmap.hint.largestCorridorSaturated",
      vars: { corridor: topBySat.corridor },
      nav: "skuIntelligence",
    });
  }
  if (corridors.some((c) => /type|character|hero/i.test(c.heroApproach))) {
    hints.push({ messageKey: "cmap.hint.refreshHeroStyle", nav: "visualProduction" });
  }
  if (corridors.some((c) => c.differentiationGap === "cmap.gap.weak_visual_competition")) {
    hints.push({ messageKey: "cmap.hint.weakVisualCompetition", nav: "visualAssets" });
  }
  hints.push({ messageKey: "cmap.hint.promptPackAngles", nav: "promptPack" });
  hints.push({ messageKey: "cmap.hint.collectionBuilder", nav: "collectionBuilder" });
  hints.push({ messageKey: "cmap.hint.assortmentActions", nav: "assortmentActions" });
  hints.push({ messageKey: "cmap.hint.marketplaceOperations", nav: "marketplaceOperations" });
  if (sourceSnapshotId) hints.push({ messageKey: "cmap.hint.skuIntel", nav: "skuIntelligence" });
  return hints.slice(0, 8);
}

/** Compose foundation from import snapshot or sample topology (no external APIs). */
export function buildCompetitiveMapFoundation(snapshot: EntitySnapshot | null): CompetitiveMapFoundation {
  const builtAt = Date.now();
  const clusters = snapshot ? deriveSearchClustersFromSnapshot(snapshot) : getSampleSearchClusters();
  const overlap = computeClusterOverlaps(clusters);
  applyOverlapRiskToClusters(clusters, overlap);
  const competitorCorridors = snapshot ? deriveCompetitorCorridors(snapshot) : getSampleCompetitorCorridors();
  linkCorridorClusters(competitorCorridors, clusters);
  const saturationByClusterId = computeSaturationByClusterId(clusters);
  for (const c of clusters) {
    const v = saturationByClusterId[c.id];
    if (v != null) c.saturationLevel = v;
  }
  const pressure = computeHeroPressure(clusters, competitorCorridors);
  const differentiationNoteKeys = buildDifferentiationNoteKeys(clusters, competitorCorridors);
  const integrationHints = buildIntegrationHints(clusters, competitorCorridors, snapshot?.id ?? null);
  return {
    sourceSnapshotId: snapshot?.id ?? null,
    builtAt,
    clusters,
    competitorCorridors,
    saturationByClusterId,
    overlap,
    pressure,
    differentiationNoteKeys,
    integrationHints,
  };
}
