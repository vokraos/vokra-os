import type {
  DimensionInsight,
  MarketplaceScreenshotAnalysis,
  VisualAnalysisResult,
  VisualCompareAnalysis,
  VisualConversionPrediction,
  VisualCtrClusterItem,
  VisualDimensions,
  VisualGenerativeBundle,
  VisualProductionClusterItem,
  VisualRecommendation,
  VisualRecommendationClusters,
  VisualScores,
  VisualScoreConfidence,
} from "./types";

function clampScore(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function dim(v: unknown): DimensionInsight {
  if (!v || typeof v !== "object") return { score: 0, insight: "" };
  const o = v as Record<string, unknown>;
  return {
    score: clampScore(o.score),
    insight: typeof o.insight === "string" ? o.insight : "",
  };
}

function parseDimensions(raw: unknown): VisualDimensions {
  const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    composition: dim(d.composition),
    contrast: dim(d.contrast),
    thumbnailVisibility: dim(d.thumbnailVisibility),
    printReadability: dim(d.printReadability),
    luxuryPerception: dim(d.luxuryPerception),
    fashionPositioning: dim(d.fashionPositioning),
    emotionalTone: dim(d.emotionalTone),
    cinematicQuality: dim(d.cinematicQuality),
    marketplaceCtrPotential: dim(d.marketplaceCtrPotential),
    mobileReadability: dim(d.mobileReadability),
    silhouetteVisibility: dim(d.silhouetteVisibility),
    lightingQuality: dim(d.lightingQuality),
  };
}

function parseScores(raw: unknown): VisualScores {
  const s = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    ctrPotential: clampScore(s.ctrPotential),
    marketplace: clampScore(s.marketplace),
    cinematic: clampScore(s.cinematic),
    luxury: clampScore(s.luxury),
    readability: clampScore(s.readability),
    emotionalImpact: clampScore(s.emotionalImpact),
  };
}

function parseMarketplace(raw: unknown): MarketplaceScreenshotAnalysis | null {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const weaknesses = Array.isArray(m.likelyConversionWeaknesses)
    ? m.likelyConversionWeaknesses.filter((x): x is string => typeof x === "string")
    : [];
  return {
    stoppingPower: dim(m.stoppingPower),
    firstImageEffectiveness: dim(m.firstImageEffectiveness),
    mobileFeedVisibility: dim(m.mobileFeedVisibility),
    likelyConversionWeaknesses: weaknesses,
    visualClutter: dim(m.visualClutter),
    printVisibility: dim(m.printVisibility),
    emotionalImpactInFeed: dim(m.emotionalImpactInFeed),
  };
}

function parseRecs(raw: unknown): VisualRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const o = r as Record<string, unknown>;
      const pr = o.priority === "high" || o.priority === "medium" || o.priority === "low" ? o.priority : "medium";
      const action = typeof o.action === "string" ? o.action : "";
      const rationale = typeof o.rationale === "string" ? o.rationale : "";
      if (!action) return null;
      return { action, rationale, priority: pr };
    })
    .filter((x): x is VisualRecommendation => x != null);
}

function parseGenerative(raw: unknown): VisualGenerativeBundle {
  const g = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const seo = g.seoDirection && typeof g.seoDirection === "object" ? (g.seoDirection as Record<string, unknown>) : {};
  const titleSeeds = Array.isArray(seo.titleSeeds) ? seo.titleSeeds.filter((x): x is string => typeof x === "string") : [];
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.filter((x): x is string => typeof x === "string") : [];

  const blocksRaw = Array.isArray(g.richContentBlocks) ? g.richContentBlocks : [];
  const richContentBlocks = blocksRaw
    .map((b) => {
      if (!b || typeof b !== "object") return null;
      const o = b as Record<string, unknown>;
      const blockTitle = typeof o.blockTitle === "string" ? o.blockTitle : "";
      const angle = typeof o.angle === "string" ? o.angle : "";
      const heroPromptHint = typeof o.heroPromptHint === "string" ? o.heroPromptHint : "";
      if (!blockTitle) return null;
      return { blockTitle, angle, heroPromptHint };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const strArr = (k: string) =>
    Array.isArray(g[k]) ? (g[k] as unknown[]).filter((x): x is string => typeof x === "string") : [];

  return {
    seoDirection: {
      titleSeeds,
      descriptionAngle: typeof seo.descriptionAngle === "string" ? seo.descriptionAngle : "",
      keywords,
      marketplaceTone: typeof seo.marketplaceTone === "string" ? seo.marketplaceTone : "",
    },
    richContentBlocks,
    fashionPrompts: strArr("fashionPrompts"),
    reelsConcepts: strArr("reelsConcepts"),
    campaignConcepts: strArr("campaignConcepts"),
    thumbnailImprovements: strArr("thumbnailImprovements"),
    visualStorytelling: typeof g.visualStorytelling === "string" ? g.visualStorytelling : "",
  };
}

function parseConfidence(raw: unknown): VisualScoreConfidence | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  return {
    overall: clampScore(c.overall),
    ctrSignal: clampScore(c.ctrSignal),
    notes: typeof c.notes === "string" ? c.notes : "",
  };
}

function parseConversion(raw: unknown): VisualConversionPrediction | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  return {
    score: clampScore(c.score),
    headline: typeof c.headline === "string" ? c.headline : "",
    rationale: typeof c.rationale === "string" ? c.rationale : "",
  };
}

function parseCompare(raw: unknown): VisualCompareAnalysis | null | undefined {
  if (raw == null) return raw === null ? null : undefined;
  if (typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  const w = c.winner === "A" || c.winner === "B" || c.winner === "tie" ? c.winner : "tie";
  const tp = c.thumbnailPick === "A" || c.thumbnailPick === "B" || c.thumbnailPick === "tie" ? c.thumbnailPick : "tie";
  return {
    winner: w,
    thumbnailPick: tp,
    rationale: typeof c.rationale === "string" ? c.rationale : "",
    whyCtrGap: typeof c.whyCtrGap === "string" ? c.whyCtrGap : "",
    howToCloseGap: typeof c.howToCloseGap === "string" ? c.howToCloseGap : "",
  };
}

function parseClusters(raw: unknown): VisualRecommendationClusters | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  const ctrRaw = Array.isArray(c.ctrRisk) ? c.ctrRisk : [];
  const prodRaw = Array.isArray(c.production) ? c.production : [];
  const ctrRisk: VisualCtrClusterItem[] = ctrRaw
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const o = x as Record<string, unknown>;
      const title = typeof o.title === "string" ? o.title : "";
      if (!title) return null;
      return {
        title,
        whyCtr: typeof o.whyCtr === "string" ? o.whyCtr : "",
        howToFix: typeof o.howToFix === "string" ? o.howToFix : "",
      };
    })
    .filter((x): x is VisualCtrClusterItem => x != null);
  const production: VisualProductionClusterItem[] = prodRaw
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const o = x as Record<string, unknown>;
      const title = typeof o.title === "string" ? o.title : "";
      if (!title) return null;
      return {
        title,
        action: typeof o.action === "string" ? o.action : "",
        rationale: typeof o.rationale === "string" ? o.rationale : "",
      };
    })
    .filter((x): x is VisualProductionClusterItem => x != null);
  if (!ctrRisk.length && !production.length) return undefined;
  return { ctrRisk, production };
}

/** Strip optional ```json fences */
export function extractJsonPayload(text: string): string {
  const t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t);
  if (fence) return fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) return t.slice(start, end + 1);
  return t;
}

export function parseVisualAnalysisJson(raw: string): VisualAnalysisResult {
  const payload = extractJsonPayload(raw);
  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    throw new Error("Model did not return valid JSON. Retry or shorten images.");
  }
  if (!data || typeof data !== "object") throw new Error("Invalid analysis payload.");

  const o = data as Record<string, unknown>;
  const schemaVersion: 1 | 2 = o.schemaVersion === 2 ? 2 : 1;
  const metaRaw = o.meta && typeof o.meta === "object" ? (o.meta as Record<string, unknown>) : {};
  const inferred = Array.isArray(metaRaw.inferredAssetRoles)
    ? metaRaw.inferredAssetRoles.filter((x): x is string => typeof x === "string")
    : [];

  const base = {
    schemaVersion,
    meta: {
      detectedScene: typeof metaRaw.detectedScene === "string" ? metaRaw.detectedScene : "",
      inferredAssetRoles: inferred,
      wbOzonScreenshotLikelihood: clampScore(metaRaw.wbOzonScreenshotLikelihood),
      notesForCreativeDirector:
        typeof metaRaw.notesForCreativeDirector === "string" ? metaRaw.notesForCreativeDirector : "",
    },
    scores: parseScores(o.scores),
    dimensions: parseDimensions(o.dimensions),
    marketplaceScreenshot: parseMarketplace(o.marketplaceScreenshot),
    recommendations: parseRecs(o.recommendations),
    generative: parseGenerative(o.generative),
  };

  if (schemaVersion === 2) {
    const result: VisualAnalysisResult = {
      ...base,
      executiveSummary: typeof o.executiveSummary === "string" ? o.executiveSummary : "",
      quickSummary: typeof o.quickSummary === "string" ? o.quickSummary : "",
      scoreConfidence: parseConfidence(o.scoreConfidence),
      conversionPrediction: parseConversion(o.conversionPrediction),
      compare: parseCompare(o.compare),
      recommendationClusters: parseClusters(o.recommendationClusters),
    };
    return result;
  }

  const result: VisualAnalysisResult = {
    ...base,
    quickSummary: typeof metaRaw.notesForCreativeDirector === "string" ? metaRaw.notesForCreativeDirector.slice(0, 220) : "",
  };
  return result;
}
