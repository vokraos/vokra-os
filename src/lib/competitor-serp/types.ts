/** Manual SERP observations only — no scraping, no marketplace APIs. */

export const COMPETITOR_SERP_MEMORY_SCHEMA = "vokra.competitorSerp.v1" as const;

export type CompetitorSerpSource = "manual";

export type CompetitorSerpItem = {
  id: string;
  position: number;
  title: string;
  brand: string;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  heroImageNote: string;
  visualPattern: string;
  colorDominance: string;
  modelPresence: string;
  printReadability: string;
  perceivedPremiumLevel: string;
  differentiationNote: string;
};

export type CompetitorSerpSnapshot = {
  id: string;
  query: string;
  marketplace: string;
  capturedAt: number;
  source: CompetitorSerpSource;
  items: CompetitorSerpItem[];
};

export type SerpNumericBand = {
  low: number | null;
  high: number | null;
  mid: number | null;
};

export type SerpPatternShare = {
  label: string;
  count: number;
  sharePct: number;
};

export type SerpDerivedAnalysis = {
  itemCount: number;
  averagePrice: number | null;
  priceBand: SerpNumericBand;
  dominantVisualPatterns: SerpPatternShare[];
  dominantColors: SerpPatternShare[];
  /** i18n key for model usage narrative */
  modelUsageSummaryKey: string;
  modelUsageVars: Record<string, string>;
  printReadabilityBuckets: { bucket: string; count: number; sharePct: number }[];
  /** 0–100 heuristic from pasted premium labels, not marketplace truth */
  premiumPerceptionIndex: number;
  premiumLowSharePct: number;
  premiumHighSharePct: number;
  /** 0–100 structural crowding from titles + patterns */
  saturationSignal: number;
  differentiationGapKeys: string[];
  weakVisualCompetitorSharePct: number;
  strongVisualCompetitorSharePct: number;
};

export type SerpInsight = {
  id: string;
  messageKey: string;
  vars: Record<string, string>;
  severity: number;
};

export type SerpCrossModuleHint = {
  nav: string;
  messageKey: string;
  vars?: Record<string, string>;
  suggestedHeroArch?: string;
};

export type CompetitorSerpEnvelope = {
  schema: typeof COMPETITOR_SERP_MEMORY_SCHEMA;
  snapshot: CompetitorSerpSnapshot;
  analysis: SerpDerivedAnalysis;
  insights: SerpInsight[];
  crossModuleHints: SerpCrossModuleHint[];
};

export type CompetitorSerpMemoryPayload = CompetitorSerpEnvelope & {
  savedAt: number;
};
