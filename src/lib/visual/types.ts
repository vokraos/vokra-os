/**
 * Visual Intelligence Lab — structured analysis contract.
 * Designed for WB/Ozon analytics hooks, project history, and asset libraries later.
 */

export const VISUAL_ASSET_KINDS = [
  "print",
  "mockup",
  "product",
  "marketplace_screenshot",
  "fashion_reference",
  "campaign_reference",
] as const;

export type VisualAssetKind = (typeof VISUAL_ASSET_KINDS)[number];

/** Client-side staged asset before / after analysis */
export type VisualStagedAsset = {
  id: string;
  kind: VisualAssetKind;
  fileName: string;
  mime: string;
  /** data URL for preview + API */
  dataUrl: string;
  /** raw base64 without prefix */
  base64: string;
  addedAt: number;
};

export type Score0to100 = number;

export type DimensionInsight = {
  score: Score0to100;
  insight: string;
};

export type VisualScores = {
  ctrPotential: Score0to100;
  marketplace: Score0to100;
  cinematic: Score0to100;
  luxury: Score0to100;
  readability: Score0to100;
  emotionalImpact: Score0to100;
};

export type VisualDimensions = {
  composition: DimensionInsight;
  contrast: DimensionInsight;
  thumbnailVisibility: DimensionInsight;
  printReadability: DimensionInsight;
  luxuryPerception: DimensionInsight;
  fashionPositioning: DimensionInsight;
  emotionalTone: DimensionInsight;
  cinematicQuality: DimensionInsight;
  marketplaceCtrPotential: DimensionInsight;
  mobileReadability: DimensionInsight;
  silhouetteVisibility: DimensionInsight;
  lightingQuality: DimensionInsight;
};

export type MarketplaceScreenshotAnalysis = {
  stoppingPower: DimensionInsight;
  firstImageEffectiveness: DimensionInsight;
  mobileFeedVisibility: DimensionInsight;
  likelyConversionWeaknesses: string[];
  visualClutter: DimensionInsight;
  printVisibility: DimensionInsight;
  emotionalImpactInFeed: DimensionInsight;
};

export type VisualRecommendation = {
  action: string;
  rationale: string;
  priority: "high" | "medium" | "low";
};

export type SeoDirectionFromVisual = {
  titleSeeds: string[];
  descriptionAngle: string;
  keywords: string[];
  marketplaceTone: string;
};

export type RichBlockOutline = {
  blockTitle: string;
  angle: string;
  heroPromptHint: string;
};

export type VisualGenerativeBundle = {
  seoDirection: SeoDirectionFromVisual;
  richContentBlocks: RichBlockOutline[];
  fashionPrompts: string[];
  reelsConcepts: string[];
  campaignConcepts: string[];
  thumbnailImprovements: string[];
  visualStorytelling: string;
};

export type VisualAnalysisMeta = {
  detectedScene: string;
  inferredAssetRoles: string[];
  wbOzonScreenshotLikelihood: Score0to100;
  notesForCreativeDirector: string;
};

export type VisualScoreConfidence = {
  overall: Score0to100;
  ctrSignal: Score0to100;
  notes: string;
};

export type VisualConversionPrediction = {
  score: Score0to100;
  headline: string;
  rationale: string;
};

export type VisualCompareAnalysis = {
  winner: "A" | "B" | "tie";
  thumbnailPick: "A" | "B" | "tie";
  rationale: string;
  whyCtrGap: string;
  howToCloseGap: string;
};

export type VisualCtrClusterItem = {
  title: string;
  whyCtr: string;
  howToFix: string;
};

export type VisualProductionClusterItem = {
  title: string;
  action: string;
  rationale: string;
};

export type VisualRecommendationClusters = {
  ctrRisk: VisualCtrClusterItem[];
  production: VisualProductionClusterItem[];
};

/**
 * Full structured result returned by the vision model (normalized in parseAnalysis).
 * Stable shape for future API ingestion + history replay.
 */
export type VisualAnalysisResult = {
  schemaVersion: 1 | 2;
  meta: VisualAnalysisMeta;
  scores: VisualScores;
  dimensions: VisualDimensions;
  /** Present when user enabled WB/Ozon screenshot mode OR model infers screenshot */
  marketplaceScreenshot?: MarketplaceScreenshotAnalysis | null;
  recommendations: VisualRecommendation[];
  generative: VisualGenerativeBundle;
  executiveSummary?: string;
  quickSummary?: string;
  scoreConfidence?: VisualScoreConfidence;
  conversionPrediction?: VisualConversionPrediction;
  compare?: VisualCompareAnalysis | null;
  recommendationClusters?: VisualRecommendationClusters;
};

export const VISUAL_ANALYSIS_STORAGE_KEY = "vokra.visual.lastAnalysis";
