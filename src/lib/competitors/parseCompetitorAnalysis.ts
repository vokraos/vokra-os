import {
  COMPETITOR_SCHEMA_LATEST,
  type CompetitorAnalysisResult,
  type CompetitorEngineCard,
  type CompetitorEngines,
  type CompetitorExecutiveStrategic,
  type CompetitorInferredBrief,
  type CompetitorLayerBlock,
  type CompetitorSchemaVersion,
  type CompetitorSixLayers,
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

function layer(v: unknown): CompetitorLayerBlock {
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

function defaultLayers(): CompetitorSixLayers {
  const empty = (): CompetitorLayerBlock => ({ summary: "", bullets: [] });
  return {
    searchResultStructure: empty(),
    visualCompetition: empty(),
    seoCompetition: empty(),
    offerCompetition: empty(),
    psychology: empty(),
    gapAnalysis: empty(),
  };
}

function emptyExecutiveStrategic(): CompetitorExecutiveStrategic {
  return {
    marketSaturation: "",
    opportunityLevel: "",
    competitionPressure: "",
    dominantMarketArchetype: "",
    bestOpeningForVokra: "",
  };
}

function emptyInferredBrief(): CompetitorInferredBrief {
  return {
    targetAudience: "",
    priceSegment: "",
    positioning: "",
    emotionalTone: "",
    visualCategory: "",
    fashionStyle: "",
    likelyConversionIssues: "",
    seoStrategy: "",
    marketplacePositioning: "",
  };
}

function emptyEngineCard(): CompetitorEngineCard {
  return { signals: [], headline: "", body: "", moves: [] };
}

function emptyEngines(): CompetitorEngines {
  return {
    marketPatternEngine: emptyEngineCard(),
    visualPsychologyEngine: emptyEngineCard(),
    ctrIntelligence: emptyEngineCard(),
    seoStructureAnalysis: emptyEngineCard(),
    positioningGapDetector: emptyEngineCard(),
    vokraWinningBlueprint: emptyEngineCard(),
  };
}

function shortSignal(s: string, max = 36): string {
  const t = s.trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, Math.max(0, max - 1))}…`;
}

function layerToEngine(L: CompetitorLayerBlock, fallbackSignal: string): CompetitorEngineCard {
  const bullets = L.bullets.filter(Boolean);
  const signals = bullets
    .slice(0, 6)
    .map((b) => shortSignal((b.split(/[.–—:]/)[0] ?? b).trim(), 34))
    .filter(Boolean);
  const sigFinal = signals.length ? signals : fallbackSignal ? [fallbackSignal] : [];
  const headline =
    (L.summary && L.summary.split(/[.\n]/)[0]?.trim().slice(0, 160)) || (bullets[0] ? shortSignal(bullets[0]!, 120) : "—");
  return {
    signals: sigFinal,
    headline,
    body: L.summary || (bullets.length ? bullets.slice(0, 3).join(" ") : "—"),
    moves: bullets.slice(0, 8),
  };
}

function synthesizeExecutiveFromLegacy(ex: CompetitorAnalysisResult["executiveSummary"]): CompetitorExecutiveStrategic {
  return {
    marketSaturation: ex.marketDifficulty,
    opportunityLevel: ex.opportunity,
    competitionPressure: ex.riskLevel,
    dominantMarketArchetype: ex.recommendedAngle,
    bestOpeningForVokra: ex.creativeDirection,
  };
}

function synthesizeInferredPlaceholder(): CompetitorInferredBrief {
  const note = "Архив v1 — для полного авто-профиля перезапустите анализ (query + скриншоты).";
  return {
    targetAudience: note,
    priceSegment: "—",
    positioning: "—",
    emotionalTone: "—",
    visualCategory: "—",
    fashionStyle: "—",
    likelyConversionIssues: "—",
    seoStrategy: "—",
    marketplacePositioning: "—",
  };
}

function synthesizeEnginesFromLayers(
  layers: CompetitorSixLayers,
  vs: CompetitorAnalysisResult["vokraWinningStrategy"],
  weaknesses: string[],
): CompetitorEngines {
  return {
    marketPatternEngine: layerToEngine(layers.searchResultStructure, "Паттерн выдачи"),
    visualPsychologyEngine: layerToEngine(layers.visualCompetition, "Визуал"),
    ctrIntelligence: layerToEngine(layers.psychology, "CTR / психология"),
    seoStructureAnalysis: layerToEngine(layers.seoCompetition, "SEO"),
    positioningGapDetector: layerToEngine(layers.gapAnalysis, "Разрыв позиционирования"),
    vokraWinningBlueprint: {
      signals: weaknesses.slice(0, 5).map((w) => shortSignal(w, 34)),
      headline: vs.campaignHook || vs.positioning || "VOKRA winning blueprint",
      body: [vs.positioning, vs.mainPhotoConcept, vs.seoAngle].filter(Boolean).join(" ").slice(0, 600) || "—",
      moves: [
        vs.mainPhotoConcept,
        vs.offerFraming,
        vs.reelsDirection,
        vs.richContentStructure,
        ...weaknesses.slice(0, 4),
      ].filter(Boolean),
    },
  };
}

function parseEngineCard(v: unknown): CompetitorEngineCard {
  if (!v || typeof v !== "object") return emptyEngineCard();
  const o = v as Record<string, unknown>;
  return {
    signals: strArr(o.signals).slice(0, 8).map((s) => shortSignal(s, 48)),
    headline: str(o.headline),
    body: str(o.body),
    moves: strArr(o.moves).slice(0, 12),
  };
}

function parseEngines(v: unknown): CompetitorEngines | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const e = emptyEngines();
  e.marketPatternEngine = parseEngineCard(o.marketPatternEngine);
  e.visualPsychologyEngine = parseEngineCard(o.visualPsychologyEngine);
  e.ctrIntelligence = parseEngineCard(o.ctrIntelligence);
  e.seoStructureAnalysis = parseEngineCard(o.seoStructureAnalysis);
  e.positioningGapDetector = parseEngineCard(o.positioningGapDetector);
  e.vokraWinningBlueprint = parseEngineCard(o.vokraWinningBlueprint);
  const hasAny =
    e.marketPatternEngine.headline ||
    e.marketPatternEngine.body ||
    e.marketPatternEngine.signals.length ||
    e.visualPsychologyEngine.headline ||
    e.ctrIntelligence.headline;
  return hasAny ? e : null;
}

function parseExecutiveStrategic(v: unknown): CompetitorExecutiveStrategic | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const out: CompetitorExecutiveStrategic = {
    marketSaturation: str(o.marketSaturation),
    opportunityLevel: str(o.opportunityLevel),
    competitionPressure: str(o.competitionPressure),
    dominantMarketArchetype: str(o.dominantMarketArchetype),
    bestOpeningForVokra: str(o.bestOpeningForVokra),
  };
  const hasAny = Object.values(out).some((x) => x.trim().length > 0);
  return hasAny ? out : null;
}

function parseInferredBrief(v: unknown): CompetitorInferredBrief | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const out: CompetitorInferredBrief = {
    targetAudience: str(o.targetAudience),
    priceSegment: str(o.priceSegment),
    positioning: str(o.positioning),
    emotionalTone: str(o.emotionalTone),
    visualCategory: str(o.visualCategory),
    fashionStyle: str(o.fashionStyle),
    likelyConversionIssues: str(o.likelyConversionIssues),
    seoStrategy: str(o.seoStrategy),
    marketplacePositioning: str(o.marketplacePositioning),
  };
  const hasAny = Object.values(out).some((x) => x.trim().length > 0);
  return hasAny ? out : null;
}

function engineNeedsHydration(e: CompetitorEngines): boolean {
  const cards = Object.values(e);
  return cards.every((c) => !c.headline && !c.body && !c.signals.length && !c.moves.length);
}

function emptyCompetitorResult(): CompetitorAnalysisResult {
  return {
    schemaVersion: COMPETITOR_SCHEMA_LATEST,
    executiveStrategic: emptyExecutiveStrategic(),
    inferredBrief: emptyInferredBrief(),
    engines: emptyEngines(),
    executiveSummary: {
      marketDifficulty: "",
      opportunity: "",
      recommendedAngle: "",
      riskLevel: "",
      creativeDirection: "",
    },
    patternMap: { visual: [], seo: [], offer: [], emotional: [] },
    weaknessesToExploit: [],
    vokraWinningStrategy: {
      positioning: "",
      mainPhotoConcept: "",
      seoAngle: "",
      richContentStructure: "",
      offerFraming: "",
      reelsDirection: "",
      campaignHook: "",
    },
    cardBlueprint: { mainPhoto: "", secondImage: "", slides: [], notes: "" },
    seoReconstruction: {
      bestTitle: "",
      keywordClusters: [],
      wbDescription: "",
      ozonDescription: "",
      antiSpamRecommendations: [],
    },
    creativeReconstruction: {
      fashionPhotoPrompt: "",
      marketplaceMainPhotoPrompt: "",
      lifestylePrompt: "",
      richContentPrompts: "",
      reelsPrompt: "",
      campaignPrompt: "",
    },
    opportunityScores: {
      competitionIntensity: 0,
      visualOpportunity: 0,
      seoOpportunity: 0,
      trendPotential: 0,
      giftPotential: 0,
      premiumPotential: 0,
      vokraFit: 0,
      executionDifficulty: 0,
    },
    layers: defaultLayers(),
  };
}

function normalizeResult(base: CompetitorAnalysisResult): CompetitorAnalysisResult {
  const out = { ...base };

  if (!out.executiveStrategic || !Object.values(out.executiveStrategic).some((x) => x.trim())) {
    out.executiveStrategic = synthesizeExecutiveFromLegacy(out.executiveSummary);
  }

  if (!out.inferredBrief || !Object.values(out.inferredBrief).some((x) => x.trim())) {
    out.inferredBrief = out.schemaVersion === 1 ? synthesizeInferredPlaceholder() : emptyInferredBrief();
  }

  if (!out.engines || engineNeedsHydration(out.engines)) {
    out.engines = synthesizeEnginesFromLayers(out.layers, out.vokraWinningStrategy, out.weaknessesToExploit);
  }

  return out;
}

export function parseCompetitorAnalysisPayload(parsed: unknown): CompetitorAnalysisResult {
  const base = emptyCompetitorResult();
  if (!parsed || typeof parsed !== "object") return base;

  const o = parsed as Record<string, unknown>;
  const sv = o.schemaVersion;
  let schemaVersion: CompetitorSchemaVersion;
  if (sv === 2 || sv === "2") schemaVersion = 2;
  else if (sv === 1 || sv === "1") schemaVersion = 1;
  else {
    const looksV2 = Boolean(parseExecutiveStrategic(o.executiveStrategic) || parseEngines(o.engines));
    schemaVersion = looksV2 ? 2 : 1;
  }
  base.schemaVersion = schemaVersion;

  const exStrat = parseExecutiveStrategic(o.executiveStrategic);
  if (exStrat) base.executiveStrategic = exStrat;

  const inferred = parseInferredBrief(o.inferredBrief);
  if (inferred) base.inferredBrief = inferred;

  const eng = parseEngines(o.engines);
  if (eng) base.engines = eng;

  const ex = o.executiveSummary && typeof o.executiveSummary === "object" ? (o.executiveSummary as Record<string, unknown>) : {};
  base.executiveSummary = {
    marketDifficulty: str(ex.marketDifficulty),
    opportunity: str(ex.opportunity),
    recommendedAngle: str(ex.recommendedAngle),
    riskLevel: str(ex.riskLevel),
    creativeDirection: str(ex.creativeDirection),
  };

  const pm = o.patternMap && typeof o.patternMap === "object" ? (o.patternMap as Record<string, unknown>) : {};
  base.patternMap = {
    visual: strArr(pm.visual).slice(0, 16),
    seo: strArr(pm.seo).slice(0, 16),
    offer: strArr(pm.offer).slice(0, 16),
    emotional: strArr(pm.emotional).slice(0, 16),
  };

  base.weaknessesToExploit = strArr(o.weaknessesToExploit).slice(0, 20);

  const vs = o.vokraWinningStrategy && typeof o.vokraWinningStrategy === "object" ? (o.vokraWinningStrategy as Record<string, unknown>) : {};
  base.vokraWinningStrategy = {
    positioning: str(vs.positioning),
    mainPhotoConcept: str(vs.mainPhotoConcept),
    seoAngle: str(vs.seoAngle),
    richContentStructure: str(vs.richContentStructure),
    offerFraming: str(vs.offerFraming),
    reelsDirection: str(vs.reelsDirection),
    campaignHook: str(vs.campaignHook),
  };

  const cb = o.cardBlueprint && typeof o.cardBlueprint === "object" ? (o.cardBlueprint as Record<string, unknown>) : {};
  base.cardBlueprint = {
    mainPhoto: str(cb.mainPhoto),
    secondImage: str(cb.secondImage),
    slides: strArr(cb.slides).slice(0, 14),
    notes: str(cb.notes),
  };

  const sr = o.seoReconstruction && typeof o.seoReconstruction === "object" ? (o.seoReconstruction as Record<string, unknown>) : {};
  base.seoReconstruction = {
    bestTitle: str(sr.bestTitle),
    keywordClusters: strArr(sr.keywordClusters).slice(0, 24),
    wbDescription: str(sr.wbDescription),
    ozonDescription: str(sr.ozonDescription),
    antiSpamRecommendations: strArr(sr.antiSpamRecommendations).slice(0, 12),
  };

  const cr = o.creativeReconstruction && typeof o.creativeReconstruction === "object" ? (o.creativeReconstruction as Record<string, unknown>) : {};
  base.creativeReconstruction = {
    fashionPhotoPrompt: str(cr.fashionPhotoPrompt),
    marketplaceMainPhotoPrompt: str(cr.marketplaceMainPhotoPrompt),
    lifestylePrompt: str(cr.lifestylePrompt),
    richContentPrompts: str(cr.richContentPrompts),
    reelsPrompt: str(cr.reelsPrompt),
    campaignPrompt: str(cr.campaignPrompt),
  };

  const sc = o.opportunityScores && typeof o.opportunityScores === "object" ? (o.opportunityScores as Record<string, unknown>) : {};
  base.opportunityScores = {
    competitionIntensity: clamp(sc.competitionIntensity),
    visualOpportunity: clamp(sc.visualOpportunity),
    seoOpportunity: clamp(sc.seoOpportunity),
    trendPotential: clamp(sc.trendPotential),
    giftPotential: clamp(sc.giftPotential),
    premiumPotential: clamp(sc.premiumPotential),
    vokraFit: clamp(sc.vokraFit),
    executionDifficulty: clamp(sc.executionDifficulty),
  };

  const ly = o.layers && typeof o.layers === "object" ? (o.layers as Record<string, unknown>) : {};
  base.layers = {
    searchResultStructure: layer(ly.searchResultStructure),
    visualCompetition: layer(ly.visualCompetition),
    seoCompetition: layer(ly.seoCompetition),
    offerCompetition: layer(ly.offerCompetition),
    psychology: layer(ly.psychology),
    gapAnalysis: layer(ly.gapAnalysis),
  };

  return normalizeResult(base);
}

export function parseCompetitorAnalysisJson(raw: string): CompetitorAnalysisResult {
  const parsed = extractJsonObject(raw);
  return parseCompetitorAnalysisPayload(parsed);
}

/** Normalize a result loaded from Project Memory (may be v1 JSON without new blocks). */
export function normalizeStoredCompetitorResult(input: unknown): CompetitorAnalysisResult | null {
  if (!input || typeof input !== "object") return null;
  return parseCompetitorAnalysisPayload(input);
}

