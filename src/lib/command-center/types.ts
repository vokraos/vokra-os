/**
 * Strategic Command Center — meta-intelligence layer over Trend Radar, Competitor,
 * Visual Intelligence, and Project Memory. Schema v2 is the canonical contract.
 */

export const COMMAND_CENTER_SCHEMA_VERSION = 2 as const;
export type CommandCenterSchemaVersion = 1 | typeof COMMAND_CENTER_SCHEMA_VERSION;

export type StrategicMarketplace = "wildberries" | "ozon" | "both";
export type StrategicMode = "aggressive" | "premium" | "scalable";
export type StrategicPriceSegment = "low" | "middle" | "premium";

export type StrategicExecutiveVerdict = {
  verdict: string;
  confidence: string;
  dominationScore: number;
  marketWindow: string;
  primaryRisk: string;
  whyNow: string;
};

export type ExecutiveDashboard = {
  commandSummary: string;
  marketPressure: string;
  launchPriority: string;
  profitabilityPotential: string;
  recommendedActions: string[];
};

export type UnifiedScores = {
  opportunity: number;
  launchReadiness: number;
  profitability: number;
  visualCohesion: number;
  seoLeverage: number;
  productionRisk: number;
};

/** Cross-module read — not a second Trend Radar run. */
export type TrendSignalBrief = {
  headline: string;
  synthesis: string;
  saturation: string;
  velocity: string;
  emotionalDrivers: string[];
};

export type CompetitorSynthesis = {
  narrative: string;
  marketWeaknesses: string[];
  visualPatterns: string[];
  seoPatterns: string[];
  pricingPatterns: string[];
};

export type SkuLaunchMapRow = {
  skuName: string;
  priority: number;
  fitLine: "oversize" | "standard" | "both";
  rationale: string;
  marketplaceAngle: string;
};

export type PricingStrategyBlock = {
  anchorBand: string;
  ladder: string[];
  wbOzonTactics: string;
  marginGuardrails: string[];
};

export type VisualDirectionBlock = {
  heroStyle: string;
  colorDirection: string;
  compositionDirection: string;
  photographyDirection: string;
  oversizeNotes: string;
  standardFitNotes: string;
  marketplaceCtrAdvice: string[];
};

export type ContentStrategyBlock = {
  pillars: string[];
  reelsIdeas: string[];
  campaignAngles: string[];
  ugcHooks: string[];
  storytellingAngles: string[];
};

export type ProductionRiskBlock = {
  dtfPipeline: string;
  complexity: string;
  scalability: string;
  riskLevel: string;
  marginPotential: string;
  bottlenecks: string[];
  mitigations: string[];
  manufacturingAdvice: string[];
};

export type SeoPriorityTier = {
  tier: string;
  items: { focus: string; action: string; priority: string }[];
};

export type ActionHorizons = {
  days7: string[];
  days30: string[];
  days90: string[];
};

export type LaunchPlanWeek = {
  day1: string;
  day2: string;
  day3: string;
  day4: string;
  day5: string;
  day6: string;
  day7: string;
};

export type AiDepartmentCard = {
  role: string;
  department: string;
  mission: string;
  status: "active" | "blocked" | "standby";
  coordination: string;
  output: string;
};

export type CommandCenterReport = {
  schemaVersion: CommandCenterSchemaVersion;
  executiveVerdict: StrategicExecutiveVerdict;
  executiveDashboard: ExecutiveDashboard;
  unifiedScores: UnifiedScores;
  trendSignalBrief: TrendSignalBrief;
  competitorSynthesis: CompetitorSynthesis;
  skuLaunchMap: SkuLaunchMapRow[];
  pricingStrategy: PricingStrategyBlock;
  visualDirection: VisualDirectionBlock;
  contentStrategy: ContentStrategyBlock;
  productionRiskAnalysis: ProductionRiskBlock;
  seoPriorityMap: SeoPriorityTier[];
  actionHorizons: ActionHorizons;
  launchPlanWeek: LaunchPlanWeek;
  aiDepartments: AiDepartmentCard[];
  bottleneckDetection: string[];
  recommendedExperiments: string[];
  scalingOpportunities: string[];
  growthForecast: string;
  tacticalRoadmap: string;
  launchRecommendations: string[];
  finalCommand: string;
};

export type StrategicCommandInput = {
  query: string;
  goal: string;
  marketplace: StrategicMarketplace;
  mode: StrategicMode;
  priceSegment: StrategicPriceSegment;
  locale: "ru" | "en";
  includeProjectMemory: boolean;
  /** When null, active project is used if memory is on. */
  projectId?: string | null;
};

export type StrategicCommandResult = CommandCenterReport;

export type StrategicOrchestrationParams = {
  apiKey: string;
  model: string;
  input: StrategicCommandInput;
  /** data:image/...;base64,... */
  screenshotDataUrls: string[];
};
