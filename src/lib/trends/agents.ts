/**
 * Stable agent IDs for Trend Radar — future hooks:
 * WB search analytics, Ozon analytics, MPStats CSV, TikTok/Pinterest/IG import,
 * seasonal calendar automation, competitor watch, autonomous SKU generation.
 */
export const TREND_AGENT_IDS = [
  "trendHunter",
  "marketplaceStrategist",
  "creativeDirector",
  "seoAnalyst",
  "productionPlanner",
  "profitBrain",
] as const;

export type TrendAgentId = (typeof TREND_AGENT_IDS)[number];
