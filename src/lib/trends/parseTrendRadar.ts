import {
  TREND_RADAR_SCHEMA_VERSION,
  type TrendAgentRecommendations,
  type TrendAgentRole,
  type TrendCard,
  type TrendLayerBlock,
  type TrendProductConcept,
  type TrendRadarResult,
  type TrendSixLayers,
} from "./types";
import { TREND_AGENT_IDS } from "./agents";

function clamp(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
}

function layer(v: unknown): TrendLayerBlock {
  if (!v || typeof v !== "object") return { summary: "", bullets: [] };
  const o = v as Record<string, unknown>;
  return {
    summary: str(o.summary),
    bullets: strArr(o.bullets).slice(0, 14),
  };
}

function extractJsonObject(raw: string): unknown {
  const t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const inner = fence ? fence[1]!.trim() : t;
  const start = inner.indexOf("{");
  const end = inner.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(inner.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(inner);
  } catch {
    return null;
  }
}

function emptyLayers(): TrendSixLayers {
  const e = (): TrendLayerBlock => ({ summary: "", bullets: [] });
  return {
    marketDemandSignals: e(),
    trendPatterns: e(),
    marketplaceOpportunity: e(),
    productOpportunity: e(),
    creativeOpportunity: e(),
    businessPriority: e(),
  };
}

function emptyAgents(): TrendAgentRecommendations {
  const card = () => ({ headline: "", signals: [] as string[], body: "", moves: [] as string[] });
  return {
    trendHunter: card(),
    marketplaceStrategist: card(),
    creativeDirector: card(),
    seoAnalyst: card(),
    productionPlanner: card(),
    profitBrain: card(),
  };
}

function parseAgentCard(v: unknown): TrendAgentRecommendations[TrendAgentRole] {
  if (!v || typeof v !== "object") return { headline: "", signals: [], body: "", moves: [] };
  const o = v as Record<string, unknown>;
  return {
    headline: str(o.headline),
    signals: strArr(o.signals).slice(0, 8),
    body: str(o.body),
    moves: strArr(o.moves).slice(0, 10),
  };
}

function parseAgents(v: unknown): TrendAgentRecommendations {
  const base = emptyAgents();
  if (!v || typeof v !== "object") return base;
  const o = v as Record<string, unknown>;
  for (const id of TREND_AGENT_IDS) {
    base[id] = parseAgentCard(o[id]);
  }
  return base;
}

function parseTrendCard(v: unknown): TrendCard | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return {
    trendName: str(o.trendName),
    trendType: str(o.trendType),
    whyItMatters: str(o.whyItMatters),
    targetAudience: str(o.targetAudience),
    emotionalTrigger: str(o.emotionalTrigger),
    marketplacePotential: str(o.marketplacePotential),
    visualDirection: str(o.visualDirection),
    productIdeas: strArr(o.productIdeas).slice(0, 12),
    seoAngle: str(o.seoAngle),
    contentAngle: str(o.contentAngle),
    risk: str(o.risk),
    launchSpeed: str(o.launchSpeed),
    priorityScore: clamp(o.priorityScore),
  };
}

function parseProductConcept(v: unknown): TrendProductConcept | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return {
    name: str(o.name),
    printIdea: str(o.printIdea),
    productType: str(o.productType),
    targetCustomer: str(o.targetCustomer),
    marketplacePositioning: str(o.marketplacePositioning),
    visualStyle: str(o.visualStyle),
    seoCluster: str(o.seoCluster),
    richContentDirection: str(o.richContentDirection),
    reelsHook: str(o.reelsHook),
    launchDifficulty: str(o.launchDifficulty),
    expectedPotential: str(o.expectedPotential),
  };
}

function emptyResult(): TrendRadarResult {
  return {
    schemaVersion: TREND_RADAR_SCHEMA_VERSION,
    executiveSummary: {
      marketTemperature: "",
      opportunityLevel: "",
      recommendedMove: "",
      riskLevel: "",
      timingUrgency: "",
      bestStrategicAngle: "",
    },
    layers: emptyLayers(),
    trendCards: [],
    opportunityMap: {
      highDemandLowQualityCompetition: "",
      premiumGap: "",
      giftGap: "",
      seoGap: "",
      visualFatigue: "",
      underservedAudience: "",
      fastLaunchIdeas: "",
      longTermBrandIdeas: "",
    },
    productConcepts: [],
    actionPlan: {
      launchFirst: "",
      testSecond: "",
      avoid: "",
      watch: "",
      prepareSeasonally: "",
    },
    agentRecommendations: emptyAgents(),
    scores: {
      demandPotential: 0,
      trendFreshness: 0,
      giftPotential: 0,
      premiumPotential: 0,
      seoOpportunity: 0,
      visualOpportunity: 0,
      productionEase: 0,
      scalingPotential: 0,
      marginPotential: 0,
      vokraFit: 0,
    },
  };
}

export function parseTrendRadarPayload(parsed: unknown): TrendRadarResult {
  const base = emptyResult();
  if (!parsed || typeof parsed !== "object") return base;

  const o = parsed as Record<string, unknown>;

  const ex = o.executiveSummary && typeof o.executiveSummary === "object" ? (o.executiveSummary as Record<string, unknown>) : {};
  base.executiveSummary = {
    marketTemperature: str(ex.marketTemperature),
    opportunityLevel: str(ex.opportunityLevel),
    recommendedMove: str(ex.recommendedMove),
    riskLevel: str(ex.riskLevel),
    timingUrgency: str(ex.timingUrgency),
    bestStrategicAngle: str(ex.bestStrategicAngle),
  };

  const ly = o.layers && typeof o.layers === "object" ? (o.layers as Record<string, unknown>) : {};
  base.layers = {
    marketDemandSignals: layer(ly.marketDemandSignals),
    trendPatterns: layer(ly.trendPatterns),
    marketplaceOpportunity: layer(ly.marketplaceOpportunity),
    productOpportunity: layer(ly.productOpportunity),
    creativeOpportunity: layer(ly.creativeOpportunity),
    businessPriority: layer(ly.businessPriority),
  };

  if (Array.isArray(o.trendCards)) {
    base.trendCards = o.trendCards.map(parseTrendCard).filter((x): x is TrendCard => x != null && Boolean(x.trendName || x.whyItMatters));
  }

  const om = o.opportunityMap && typeof o.opportunityMap === "object" ? (o.opportunityMap as Record<string, unknown>) : {};
  base.opportunityMap = {
    highDemandLowQualityCompetition: str(om.highDemandLowQualityCompetition),
    premiumGap: str(om.premiumGap),
    giftGap: str(om.giftGap),
    seoGap: str(om.seoGap),
    visualFatigue: str(om.visualFatigue),
    underservedAudience: str(om.underservedAudience),
    fastLaunchIdeas: str(om.fastLaunchIdeas),
    longTermBrandIdeas: str(om.longTermBrandIdeas),
  };

  if (Array.isArray(o.productConcepts)) {
    base.productConcepts = o.productConcepts.map(parseProductConcept).filter((x): x is TrendProductConcept => x != null && Boolean(x.name));
  }

  const ap = o.actionPlan && typeof o.actionPlan === "object" ? (o.actionPlan as Record<string, unknown>) : {};
  base.actionPlan = {
    launchFirst: str(ap.launchFirst),
    testSecond: str(ap.testSecond),
    avoid: str(ap.avoid),
    watch: str(ap.watch),
    prepareSeasonally: str(ap.prepareSeasonally),
  };

  base.agentRecommendations = parseAgents(o.agentRecommendations);

  const sc = o.scores && typeof o.scores === "object" ? (o.scores as Record<string, unknown>) : {};
  base.scores = {
    demandPotential: clamp(sc.demandPotential),
    trendFreshness: clamp(sc.trendFreshness),
    giftPotential: clamp(sc.giftPotential),
    premiumPotential: clamp(sc.premiumPotential),
    seoOpportunity: clamp(sc.seoOpportunity),
    visualOpportunity: clamp(sc.visualOpportunity),
    productionEase: clamp(sc.productionEase),
    scalingPotential: clamp(sc.scalingPotential),
    marginPotential: clamp(sc.marginPotential),
    vokraFit: clamp(sc.vokraFit),
  };

  return base;
}

export function parseTrendRadarJson(raw: string): TrendRadarResult {
  return parseTrendRadarPayload(extractJsonObject(raw));
}

export function normalizeStoredTrendRadar(input: unknown): TrendRadarResult | null {
  if (!input || typeof input !== "object") return null;
  return parseTrendRadarPayload(input);
}
