/**
 * Trend Radar V1 — structured JSON for UI + Project Memory.
 * No live scraping; evidence = user niche, pastes, screenshots, notes.
 */

export const TREND_RADAR_SCHEMA_VERSION = 1 as const;

export type TrendMarketplaceFocus = "wildberries" | "ozon" | "social" | "all";

export type TrendLayerBlock = {
  summary: string;
  bullets: string[];
};

export type TrendSixLayers = {
  marketDemandSignals: TrendLayerBlock;
  trendPatterns: TrendLayerBlock;
  marketplaceOpportunity: TrendLayerBlock;
  productOpportunity: TrendLayerBlock;
  creativeOpportunity: TrendLayerBlock;
  businessPriority: TrendLayerBlock;
};

export type TrendExecutiveSummary = {
  marketTemperature: string;
  opportunityLevel: string;
  recommendedMove: string;
  riskLevel: string;
  timingUrgency: string;
  bestStrategicAngle: string;
};

export type TrendCard = {
  trendName: string;
  trendType: string;
  whyItMatters: string;
  targetAudience: string;
  emotionalTrigger: string;
  marketplacePotential: string;
  visualDirection: string;
  productIdeas: string[];
  seoAngle: string;
  contentAngle: string;
  risk: string;
  launchSpeed: string;
  priorityScore: number;
};

export type TrendOpportunityMap = {
  highDemandLowQualityCompetition: string;
  premiumGap: string;
  giftGap: string;
  seoGap: string;
  visualFatigue: string;
  underservedAudience: string;
  fastLaunchIdeas: string;
  longTermBrandIdeas: string;
};

export type TrendProductConcept = {
  name: string;
  printIdea: string;
  productType: string;
  targetCustomer: string;
  marketplacePositioning: string;
  visualStyle: string;
  seoCluster: string;
  richContentDirection: string;
  reelsHook: string;
  launchDifficulty: string;
  expectedPotential: string;
};

export type TrendActionPlan = {
  launchFirst: string;
  testSecond: string;
  avoid: string;
  watch: string;
  prepareSeasonally: string;
};

export type TrendAgentRecommendation = {
  headline: string;
  signals: string[];
  body: string;
  moves: string[];
};

export type TrendAgentRole =
  | "trendHunter"
  | "marketplaceStrategist"
  | "creativeDirector"
  | "seoAnalyst"
  | "productionPlanner"
  | "profitBrain";

export type TrendAgentRecommendations = Record<TrendAgentRole, TrendAgentRecommendation>;

export type TrendScores = {
  demandPotential: number;
  trendFreshness: number;
  giftPotential: number;
  premiumPotential: number;
  seoOpportunity: number;
  visualOpportunity: number;
  productionEase: number;
  scalingPotential: number;
  marginPotential: number;
  vokraFit: number;
};

export type TrendRadarResult = {
  schemaVersion: typeof TREND_RADAR_SCHEMA_VERSION;
  executiveSummary: TrendExecutiveSummary;
  layers: TrendSixLayers;
  trendCards: TrendCard[];
  opportunityMap: TrendOpportunityMap;
  productConcepts: TrendProductConcept[];
  actionPlan: TrendActionPlan;
  agentRecommendations: TrendAgentRecommendations;
  scores: TrendScores;
};

export type TrendStagedImage = {
  id: string;
  fileName: string;
  mime: string;
  dataUrl: string;
  addedAt: number;
};
