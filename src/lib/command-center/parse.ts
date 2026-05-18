import {
  COMMAND_CENTER_SCHEMA_VERSION,
  type ActionHorizons,
  type AiDepartmentCard,
  type CommandCenterReport,
  type CompetitorSynthesis,
  type ContentStrategyBlock,
  type ExecutiveDashboard,
  type LaunchPlanWeek,
  type PricingStrategyBlock,
  type ProductionRiskBlock,
  type SeoPriorityTier,
  type SkuLaunchMapRow,
  type StrategicExecutiveVerdict,
  type TrendSignalBrief,
  type UnifiedScores,
  type VisualDirectionBlock,
} from "./types";

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

function emptyExecutive(): StrategicExecutiveVerdict {
  return {
    verdict: "",
    confidence: "",
    dominationScore: 0,
    marketWindow: "",
    primaryRisk: "",
    whyNow: "",
  };
}

function emptyDashboard(): ExecutiveDashboard {
  return {
    commandSummary: "",
    marketPressure: "",
    launchPriority: "",
    profitabilityPotential: "",
    recommendedActions: [],
  };
}

function emptyUnified(): UnifiedScores {
  return {
    opportunity: 0,
    launchReadiness: 0,
    profitability: 0,
    visualCohesion: 0,
    seoLeverage: 0,
    productionRisk: 0,
  };
}

function emptyTrendBrief(): TrendSignalBrief {
  return { headline: "", synthesis: "", saturation: "", velocity: "", emotionalDrivers: [] };
}

function emptyCompetitor(): CompetitorSynthesis {
  return { narrative: "", marketWeaknesses: [], visualPatterns: [], seoPatterns: [], pricingPatterns: [] };
}

function emptyPricing(): PricingStrategyBlock {
  return { anchorBand: "", ladder: [], wbOzonTactics: "", marginGuardrails: [] };
}

function emptyVisual(): VisualDirectionBlock {
  return {
    heroStyle: "",
    colorDirection: "",
    compositionDirection: "",
    photographyDirection: "",
    oversizeNotes: "",
    standardFitNotes: "",
    marketplaceCtrAdvice: [],
  };
}

function emptyContent(): ContentStrategyBlock {
  return { pillars: [], reelsIdeas: [], campaignAngles: [], ugcHooks: [], storytellingAngles: [] };
}

function emptyProduction(): ProductionRiskBlock {
  return {
    dtfPipeline: "",
    complexity: "",
    scalability: "",
    riskLevel: "",
    marginPotential: "",
    bottlenecks: [],
    mitigations: [],
    manufacturingAdvice: [],
  };
}

function emptyHorizons(): ActionHorizons {
  return { days7: [], days30: [], days90: [] };
}

function emptyWeek(): LaunchPlanWeek {
  return { day1: "", day2: "", day3: "", day4: "", day5: "", day6: "", day7: "" };
}

function emptyReport(): CommandCenterReport {
  return {
    schemaVersion: COMMAND_CENTER_SCHEMA_VERSION,
    executiveVerdict: emptyExecutive(),
    executiveDashboard: emptyDashboard(),
    unifiedScores: emptyUnified(),
    trendSignalBrief: emptyTrendBrief(),
    competitorSynthesis: emptyCompetitor(),
    skuLaunchMap: [],
    pricingStrategy: emptyPricing(),
    visualDirection: emptyVisual(),
    contentStrategy: emptyContent(),
    productionRiskAnalysis: emptyProduction(),
    seoPriorityMap: [],
    actionHorizons: emptyHorizons(),
    launchPlanWeek: emptyWeek(),
    aiDepartments: [],
    bottleneckDetection: [],
    recommendedExperiments: [],
    scalingOpportunities: [],
    growthForecast: "",
    tacticalRoadmap: "",
    launchRecommendations: [],
    finalCommand: "",
  };
}

function parseSkuRow(v: unknown): SkuLaunchMapRow | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const name = str(o.skuName);
  if (!name) return null;
  const fl = str(o.fitLine).toLowerCase();
  const fitLine: SkuLaunchMapRow["fitLine"] =
    fl === "oversize" || fl === "standard" || fl === "both" ? fl : "both";
  return {
    skuName: name,
    priority: clamp(o.priority) || 50,
    fitLine,
    rationale: str(o.rationale),
    marketplaceAngle: str(o.marketplaceAngle),
  };
}

function parseSeoTier(v: unknown): SeoPriorityTier | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const tier = str(o.tier);
  if (!tier) return null;
  const itemsRaw = Array.isArray(o.items) ? o.items : [];
  const items = itemsRaw
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const x = it as Record<string, unknown>;
      return {
        focus: str(x.focus),
        action: str(x.action),
        priority: str(x.priority),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null && Boolean(x.focus || x.action));
  return { tier, items };
}

function parseDept(v: unknown): AiDepartmentCard | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const role = str(o.role);
  if (!role) return null;
  const st = str(o.status).toLowerCase();
  const status: AiDepartmentCard["status"] =
    st === "blocked" ? "blocked" : st === "standby" ? "standby" : "active";
  return {
    role,
    department: str(o.department),
    mission: str(o.mission),
    status,
    coordination: str(o.coordination),
    output: str(o.output),
  };
}

/** Upgrade legacy schema v1 payload into v2 CommandCenterReport. */
function upgradeFromV1(o: Record<string, unknown>): CommandCenterReport {
  const base = emptyReport();
  base.schemaVersion = 1;

  const ev = o.executiveVerdict && typeof o.executiveVerdict === "object" ? (o.executiveVerdict as Record<string, unknown>) : {};
  base.executiveVerdict = {
    verdict: str(ev.verdict),
    confidence: str(ev.confidence),
    dominationScore: clamp(ev.dominationScore),
    marketWindow: str(ev.marketWindow),
    primaryRisk: str(ev.primaryRisk),
    whyNow: str(ev.whyNow),
  };

  base.executiveDashboard = {
    commandSummary: str(ev.verdict) || "—",
    marketPressure: "",
    launchPriority: str(ev.marketWindow),
    profitabilityPotential: str(ev.confidence),
    recommendedActions: [],
  };

  const opp = clamp(ev.dominationScore);
  base.unifiedScores = {
    opportunity: opp,
    launchReadiness: opp,
    profitability: opp,
    visualCohesion: opp,
    seoLeverage: opp,
    productionRisk: 100 - opp,
  };

  const tr = o.trendIntelligence && typeof o.trendIntelligence === "object" ? (o.trendIntelligence as Record<string, unknown>) : {};
  base.trendSignalBrief = {
    headline: str(tr.opportunity).slice(0, 120),
    synthesis: str(tr.opportunity),
    saturation: str(tr.saturation),
    velocity: str(tr.velocity),
    emotionalDrivers: strArr(tr.emotionalDrivers).slice(0, 12),
  };

  const cm = o.competitorMap && typeof o.competitorMap === "object" ? (o.competitorMap as Record<string, unknown>) : {};
  base.competitorSynthesis = {
    narrative: "",
    marketWeaknesses: strArr(cm.marketWeaknesses).slice(0, 16),
    visualPatterns: strArr(cm.visualPatterns).slice(0, 16),
    seoPatterns: strArr(cm.seoPatterns).slice(0, 16),
    pricingPatterns: strArr(cm.pricingPatterns).slice(0, 16),
  };

  const vd = o.visualDirection && typeof o.visualDirection === "object" ? (o.visualDirection as Record<string, unknown>) : {};
  base.visualDirection = {
    heroStyle: str(vd.heroStyle),
    colorDirection: str(vd.colorDirection),
    compositionDirection: str(vd.compositionDirection),
    photographyDirection: str(vd.photographyDirection),
    oversizeNotes: "",
    standardFitNotes: "",
    marketplaceCtrAdvice: strArr(vd.marketplaceCtrAdvice).slice(0, 14),
  };

  const se = o.seoStrategy && typeof o.seoStrategy === "object" ? (o.seoStrategy as Record<string, unknown>) : {};
  const clusters = strArr(se.keywordClusters);
  base.seoPriorityMap =
    clusters.length > 0
      ? [
          {
            tier: "P1",
            items: clusters.slice(0, 12).map((c) => ({ focus: c, action: str(se.titleDirection), priority: "high" })),
          },
        ]
      : [];

  const lp = o.launchPlan && typeof o.launchPlan === "object" ? (o.launchPlan as Record<string, unknown>) : {};
  base.launchPlanWeek = {
    day1: str(lp.day1),
    day2: str(lp.day2),
    day3: str(lp.day3),
    day4: str(lp.day4),
    day5: str(lp.day5),
    day6: str(lp.day6),
    day7: str(lp.day7),
  };
  const weekSteps = [str(lp.day1), str(lp.day2), str(lp.day3), str(lp.day4), str(lp.day5), str(lp.day6), str(lp.day7)].filter(
    Boolean,
  );
  base.actionHorizons = { days7: weekSteps, days30: [], days90: [] };

  const cx = o.contentMachine && typeof o.contentMachine === "object" ? (o.contentMachine as Record<string, unknown>) : {};
  base.contentStrategy = {
    pillars: [],
    reelsIdeas: strArr(cx.reelsIdeas).slice(0, 16),
    campaignAngles: strArr(cx.campaignAngles).slice(0, 16),
    ugcHooks: strArr(cx.ugcHooks).slice(0, 16),
    storytellingAngles: strArr(cx.storytellingAngles).slice(0, 16),
  };

  const pi = o.productionIntelligence && typeof o.productionIntelligence === "object" ? (o.productionIntelligence as Record<string, unknown>) : {};
  const mfg = strArr(pi.manufacturingAdvice);
  base.productionRiskAnalysis = {
    dtfPipeline: mfg.slice(0, 2).join(" · "),
    complexity: str(pi.complexity),
    scalability: str(pi.scalability),
    riskLevel: str(pi.riskLevel),
    marginPotential: str(pi.marginPotential),
    bottlenecks: [],
    mitigations: [],
    manufacturingAdvice: mfg.slice(0, 14),
  };

  if (Array.isArray(o.aiAgents)) {
    base.aiDepartments = (o.aiAgents as unknown[])
      .map((a) => {
        if (!a || typeof a !== "object") return null;
        const x = a as Record<string, unknown>;
        return parseDept({
          role: x.role,
          department: "Board",
          mission: x.mission,
          status: "active",
          coordination: str(x.priority),
          output: x.output,
        });
      })
      .filter((x): x is AiDepartmentCard => x != null);
  }

  base.pricingStrategy = { anchorBand: "", ladder: [], wbOzonTactics: "", marginGuardrails: [] };
  base.skuLaunchMap = [];
  base.bottleneckDetection = [];
  base.recommendedExperiments = [];
  base.scalingOpportunities = [];
  base.growthForecast = "";
  base.tacticalRoadmap = str(o.finalCommand);
  base.launchRecommendations = weekSteps;
  base.finalCommand = str(o.finalCommand);

  return base;
}

export function parseStrategicCommandPayload(parsed: unknown): CommandCenterReport {
  const base = emptyReport();
  if (!parsed || typeof parsed !== "object") return base;

  const o = parsed as Record<string, unknown>;
  const isV1 =
    o.schemaVersion === 1 ||
    (o.schemaVersion == null && o.trendIntelligence != null && typeof o.trendIntelligence === "object" && o.trendSignalBrief == null);
  if (isV1) {
    return upgradeFromV1(o);
  }

  base.schemaVersion = COMMAND_CENTER_SCHEMA_VERSION;

  const ev = o.executiveVerdict && typeof o.executiveVerdict === "object" ? (o.executiveVerdict as Record<string, unknown>) : {};
  base.executiveVerdict = {
    verdict: str(ev.verdict),
    confidence: str(ev.confidence),
    dominationScore: clamp(ev.dominationScore),
    marketWindow: str(ev.marketWindow),
    primaryRisk: str(ev.primaryRisk),
    whyNow: str(ev.whyNow),
  };

  const dash = o.executiveDashboard && typeof o.executiveDashboard === "object" ? (o.executiveDashboard as Record<string, unknown>) : {};
  base.executiveDashboard = {
    commandSummary: str(dash.commandSummary),
    marketPressure: str(dash.marketPressure),
    launchPriority: str(dash.launchPriority),
    profitabilityPotential: str(dash.profitabilityPotential),
    recommendedActions: strArr(dash.recommendedActions).slice(0, 12),
  };

  const us = o.unifiedScores && typeof o.unifiedScores === "object" ? (o.unifiedScores as Record<string, unknown>) : {};
  base.unifiedScores = {
    opportunity: clamp(us.opportunity),
    launchReadiness: clamp(us.launchReadiness),
    profitability: clamp(us.profitability),
    visualCohesion: clamp(us.visualCohesion),
    seoLeverage: clamp(us.seoLeverage),
    productionRisk: clamp(us.productionRisk),
  };

  const tb = o.trendSignalBrief && typeof o.trendSignalBrief === "object" ? (o.trendSignalBrief as Record<string, unknown>) : {};
  base.trendSignalBrief = {
    headline: str(tb.headline),
    synthesis: str(tb.synthesis),
    saturation: str(tb.saturation),
    velocity: str(tb.velocity),
    emotionalDrivers: strArr(tb.emotionalDrivers).slice(0, 12),
  };

  const cs = o.competitorSynthesis && typeof o.competitorSynthesis === "object" ? (o.competitorSynthesis as Record<string, unknown>) : {};
  base.competitorSynthesis = {
    narrative: str(cs.narrative),
    marketWeaknesses: strArr(cs.marketWeaknesses).slice(0, 16),
    visualPatterns: strArr(cs.visualPatterns).slice(0, 16),
    seoPatterns: strArr(cs.seoPatterns).slice(0, 16),
    pricingPatterns: strArr(cs.pricingPatterns).slice(0, 16),
  };

  if (Array.isArray(o.skuLaunchMap)) {
    base.skuLaunchMap = o.skuLaunchMap.map(parseSkuRow).filter((x): x is SkuLaunchMapRow => x != null).slice(0, 12);
  }

  const pr = o.pricingStrategy && typeof o.pricingStrategy === "object" ? (o.pricingStrategy as Record<string, unknown>) : {};
  base.pricingStrategy = {
    anchorBand: str(pr.anchorBand),
    ladder: strArr(pr.ladder).slice(0, 12),
    wbOzonTactics: str(pr.wbOzonTactics),
    marginGuardrails: strArr(pr.marginGuardrails).slice(0, 12),
  };

  const vd = o.visualDirection && typeof o.visualDirection === "object" ? (o.visualDirection as Record<string, unknown>) : {};
  base.visualDirection = {
    heroStyle: str(vd.heroStyle),
    colorDirection: str(vd.colorDirection),
    compositionDirection: str(vd.compositionDirection),
    photographyDirection: str(vd.photographyDirection),
    oversizeNotes: str(vd.oversizeNotes),
    standardFitNotes: str(vd.standardFitNotes),
    marketplaceCtrAdvice: strArr(vd.marketplaceCtrAdvice).slice(0, 14),
  };

  const cx = o.contentStrategy && typeof o.contentStrategy === "object" ? (o.contentStrategy as Record<string, unknown>) : {};
  base.contentStrategy = {
    pillars: strArr(cx.pillars).slice(0, 10),
    reelsIdeas: strArr(cx.reelsIdeas).slice(0, 16),
    campaignAngles: strArr(cx.campaignAngles).slice(0, 16),
    ugcHooks: strArr(cx.ugcHooks).slice(0, 16),
    storytellingAngles: strArr(cx.storytellingAngles).slice(0, 16),
  };

  const pi = o.productionRiskAnalysis && typeof o.productionRiskAnalysis === "object" ? (o.productionRiskAnalysis as Record<string, unknown>) : {};
  base.productionRiskAnalysis = {
    dtfPipeline: str(pi.dtfPipeline),
    complexity: str(pi.complexity),
    scalability: str(pi.scalability),
    riskLevel: str(pi.riskLevel),
    marginPotential: str(pi.marginPotential),
    bottlenecks: strArr(pi.bottlenecks).slice(0, 12),
    mitigations: strArr(pi.mitigations).slice(0, 12),
    manufacturingAdvice: strArr(pi.manufacturingAdvice).slice(0, 14),
  };

  if (Array.isArray(o.seoPriorityMap)) {
    base.seoPriorityMap = o.seoPriorityMap.map(parseSeoTier).filter((x): x is SeoPriorityTier => x != null).slice(0, 8);
  }

  const ah = o.actionHorizons && typeof o.actionHorizons === "object" ? (o.actionHorizons as Record<string, unknown>) : {};
  base.actionHorizons = {
    days7: strArr(ah.days7).slice(0, 14),
    days30: strArr(ah.days30).slice(0, 16),
    days90: strArr(ah.days90).slice(0, 16),
  };

  const lw = o.launchPlanWeek && typeof o.launchPlanWeek === "object" ? (o.launchPlanWeek as Record<string, unknown>) : {};
  base.launchPlanWeek = {
    day1: str(lw.day1),
    day2: str(lw.day2),
    day3: str(lw.day3),
    day4: str(lw.day4),
    day5: str(lw.day5),
    day6: str(lw.day6),
    day7: str(lw.day7),
  };

  if (Array.isArray(o.aiDepartments)) {
    base.aiDepartments = o.aiDepartments.map(parseDept).filter((x): x is AiDepartmentCard => x != null).slice(0, 12);
  }

  base.bottleneckDetection = strArr(o.bottleneckDetection).slice(0, 14);
  base.recommendedExperiments = strArr(o.recommendedExperiments).slice(0, 14);
  base.scalingOpportunities = strArr(o.scalingOpportunities).slice(0, 14);
  base.growthForecast = str(o.growthForecast);
  base.tacticalRoadmap = str(o.tacticalRoadmap);
  base.launchRecommendations = strArr(o.launchRecommendations).slice(0, 14);
  base.finalCommand = str(o.finalCommand);

  return base;
}

export function parseStrategicCommandJson(raw: string): CommandCenterReport {
  return parseStrategicCommandPayload(extractJsonObject(raw));
}

export function normalizeStoredStrategicCommand(input: unknown): CommandCenterReport | null {
  if (!input || typeof input !== "object") return null;
  return parseStrategicCommandPayload(input);
}
