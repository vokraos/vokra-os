/**
 * Competitor Intelligence — structured JSON for UI + Project Memory.
 * schemaVersion 2: agent-style engines + executive command block + auto-inferred brief.
 * schemaVersion 1: legacy; normalized at parse time for UI.
 */

export const COMPETITOR_SCHEMA_LATEST = 2 as const;

export type CompetitorSchemaVersion = 1 | 2;

export type CompetitorMarketplace = "wildberries" | "ozon" | "both";

/** Premium top-of-report strategic block (RU strings from model). */
export type CompetitorExecutiveStrategic = {
  marketSaturation: string;
  opportunityLevel: string;
  competitionPressure: string;
  dominantMarketArchetype: string;
  bestOpeningForVokra: string;
};

/** Auto-inferred from query + screenshots (no user manual fill required). */
export type CompetitorInferredBrief = {
  targetAudience: string;
  priceSegment: string;
  positioning: string;
  emotionalTone: string;
  visualCategory: string;
  fashionStyle: string;
  likelyConversionIssues: string;
  seoStrategy: string;
  marketplacePositioning: string;
};

/** One specialized “AI system” output card. */
export type CompetitorEngineCard = {
  signals: string[];
  headline: string;
  body: string;
  moves: string[];
};

export type CompetitorEngines = {
  marketPatternEngine: CompetitorEngineCard;
  visualPsychologyEngine: CompetitorEngineCard;
  ctrIntelligence: CompetitorEngineCard;
  seoStructureAnalysis: CompetitorEngineCard;
  positioningGapDetector: CompetitorEngineCard;
  vokraWinningBlueprint: CompetitorEngineCard;
};

export type CompetitorLayerBlock = {
  summary: string;
  bullets: string[];
};

export type CompetitorSixLayers = {
  searchResultStructure: CompetitorLayerBlock;
  visualCompetition: CompetitorLayerBlock;
  seoCompetition: CompetitorLayerBlock;
  offerCompetition: CompetitorLayerBlock;
  psychology: CompetitorLayerBlock;
  gapAnalysis: CompetitorLayerBlock;
};

export type CompetitorOpportunityScores = {
  competitionIntensity: number;
  visualOpportunity: number;
  seoOpportunity: number;
  trendPotential: number;
  giftPotential: number;
  premiumPotential: number;
  vokraFit: number;
  executionDifficulty: number;
};

export type CompetitorAnalysisResult = {
  schemaVersion: CompetitorSchemaVersion;
  executiveStrategic: CompetitorExecutiveStrategic;
  inferredBrief: CompetitorInferredBrief;
  engines: CompetitorEngines;
  executiveSummary: {
    marketDifficulty: string;
    opportunity: string;
    recommendedAngle: string;
    riskLevel: string;
    creativeDirection: string;
  };
  patternMap: {
    visual: string[];
    seo: string[];
    offer: string[];
    emotional: string[];
  };
  weaknessesToExploit: string[];
  vokraWinningStrategy: {
    positioning: string;
    mainPhotoConcept: string;
    seoAngle: string;
    richContentStructure: string;
    offerFraming: string;
    reelsDirection: string;
    campaignHook: string;
  };
  cardBlueprint: {
    mainPhoto: string;
    secondImage: string;
    slides: string[];
    notes: string;
  };
  seoReconstruction: {
    bestTitle: string;
    keywordClusters: string[];
    wbDescription: string;
    ozonDescription: string;
    antiSpamRecommendations: string[];
  };
  creativeReconstruction: {
    fashionPhotoPrompt: string;
    marketplaceMainPhotoPrompt: string;
    lifestylePrompt: string;
    richContentPrompts: string;
    reelsPrompt: string;
    campaignPrompt: string;
  };
  opportunityScores: CompetitorOpportunityScores;
  layers: CompetitorSixLayers;
};

export type CompetitorStagedImage = {
  id: string;
  role: "search_results" | "competitor_cards" | "other";
  fileName: string;
  mime: string;
  dataUrl: string;
  addedAt: number;
};
