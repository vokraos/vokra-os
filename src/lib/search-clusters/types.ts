/** Local competitive structure — no live MP APIs, no scraped CTR. */

export const COMPETITIVE_MAP_MEMORY_SCHEMA = "vokra.competitiveMap.v1" as const;

export type SearchClusterType =
  | "broad"
  | "corridor"
  | "hero"
  | "niche"
  | "gift"
  | "trend"
  | "brand_style"
  | "experimental";

/** 0–100 structural heuristics from import topology, not marketplace truth. */
export type SearchClusterEntity = {
  id: string;
  query: string;
  normalizedQuery: string;
  corridor: string;
  marketplace: string;
  clusterType: SearchClusterType;
  heroDensity: number;
  overlapRisk: number;
  saturationLevel: number;
  visualPressure: number;
  /** Structural competition pressure (density + hero crowding), not CTR. */
  estimatedCompetition: number;
  heroPatterns: string[];
  competitorGroups: string[];
  relatedSkuIds: string[];
  relatedCardIds: string[];
  /** Human-readable structural note (current locale when built for UI/memory). */
  notes: string;
};

export type CompetitorCorridorEntity = {
  id: string;
  corridor: string;
  marketplace: string;
  visualStyle: string;
  heroApproach: string;
  saturationRisk: number;
  overlapRisk: number;
  pressureLevel: number;
  dominantPatterns: string[];
  differentiationGap: string;
  relatedClusters: string[];
};

export type ClusterOverlapEdge = {
  aId: string;
  bId: string;
  risk: number;
};

export type HeroPressureSignal = {
  id: string;
  /** i18n key — examples: dark typography saturation, hero overlap. */
  messageKey: string;
  vars: Record<string, string>;
  /** 0–100 */
  severity: number;
};

export type CompetitiveMapIntegrationHint = {
  messageKey: string;
  vars?: Record<string, string>;
  /** Nav target id (matches `NavId` in app). */
  nav: string;
};

export type CompetitiveMapFoundation = {
  sourceSnapshotId: string | null;
  builtAt: number;
  clusters: SearchClusterEntity[];
  competitorCorridors: CompetitorCorridorEntity[];
  saturationByClusterId: Record<string, number>;
  overlap: ClusterOverlapEdge[];
  pressure: HeroPressureSignal[];
  differentiationNoteKeys: string[];
  integrationHints: CompetitiveMapIntegrationHint[];
};

export type CompetitiveMapMemoryPayload = {
  schema: typeof COMPETITIVE_MAP_MEMORY_SCHEMA;
  sourceSnapshotId: string | null;
  savedAt: number;
  foundation: CompetitiveMapFoundation;
};
