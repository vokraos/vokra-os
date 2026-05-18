import { buildStrategicDateSystemBlock, buildStrategicDateUserLine } from "../ai/strategicDateContext";
import { VOKRA_VOICE_RULES_EN } from "../ai/voice";

const JSON_CONTRACT_V2 = `Return ONE JSON object only (no markdown fences, no commentary). Schema:
{
  "schemaVersion": 2,
  "executiveStrategic": {
    "marketSaturation": string,
    "opportunityLevel": string,
    "competitionPressure": string,
    "dominantMarketArchetype": string,
    "bestOpeningForVokra": string
  },
  "inferredBrief": {
    "targetAudience": string,
    "priceSegment": string,
    "positioning": string,
    "emotionalTone": string,
    "visualCategory": string,
    "fashionStyle": string,
    "likelyConversionIssues": string,
    "seoStrategy": string,
    "marketplacePositioning": string
  },
  "engines": {
    "marketPatternEngine": { "signals": string[], "headline": string, "body": string, "moves": string[] },
    "visualPsychologyEngine": { "signals": string[], "headline": string, "body": string, "moves": string[] },
    "ctrIntelligence": { "signals": string[], "headline": string, "body": string, "moves": string[] },
    "seoStructureAnalysis": { "signals": string[], "headline": string, "body": string, "moves": string[] },
    "positioningGapDetector": { "signals": string[], "headline": string, "body": string, "moves": string[] },
    "vokraWinningBlueprint": { "signals": string[], "headline": string, "body": string, "moves": string[] }
  },
  "executiveSummary": {
    "marketDifficulty": string,
    "opportunity": string,
    "recommendedAngle": string,
    "riskLevel": string,
    "creativeDirection": string
  },
  "patternMap": { "visual": string[], "seo": string[], "offer": string[], "emotional": string[] },
  "weaknessesToExploit": string[],
  "vokraWinningStrategy": {
    "positioning": string,
    "mainPhotoConcept": string,
    "seoAngle": string,
    "richContentStructure": string,
    "offerFraming": string,
    "reelsDirection": string,
    "campaignHook": string
  },
  "cardBlueprint": {
    "mainPhoto": string,
    "secondImage": string,
    "slides": string[],
    "notes": string
  },
  "seoReconstruction": {
    "bestTitle": string,
    "keywordClusters": string[],
    "wbDescription": string,
    "ozonDescription": string,
    "antiSpamRecommendations": string[]
  },
  "creativeReconstruction": {
    "fashionPhotoPrompt": string,
    "marketplaceMainPhotoPrompt": string,
    "lifestylePrompt": string,
    "richContentPrompts": string,
    "reelsPrompt": string,
    "campaignPrompt": string
  },
  "opportunityScores": {
    "competitionIntensity": number,
    "visualOpportunity": number,
    "seoOpportunity": number,
    "trendPotential": number,
    "giftPotential": number,
    "premiumPotential": number,
    "vokraFit": number,
    "executionDifficulty": number
  },
  "layers": {
    "searchResultStructure": { "summary": string, "bullets": string[] },
    "visualCompetition": { "summary": string, "bullets": string[] },
    "seoCompetition": { "summary": string, "bullets": string[] },
    "offerCompetition": { "summary": string, "bullets": string[] },
    "psychology": { "summary": string, "bullets": string[] },
    "gapAnalysis": { "summary": string, "bullets": string[] }
  }
}
Rules:
- schemaVersion MUST be 2.
- Any timing, seasonality, “why now”, or go-to-market window language MUST follow the CLOCK in the system message (current year + upcoming months from today, or «ближайшие 30–90 дней» / “next 30–90 days” when uncertain). Do NOT output obsolete past-year seasonal ranges unless the user explicitly requests historical analysis.
- All scores 0–100 integers.
- Each engine: 3–6 short "signals" (2–5 words, label-style), headline one line, body 2–4 sentences max, moves 3–6 actionable bullets.
- patternMap arrays: 4–12 concise strings; layer bullets: 4–10 each.
- If user did not provide optional pasted text or product context, INFER inferredBrief and layers from screenshots + query alone; state uncertainty briefly inside engine body when needed.
- engines must align with layers but be more scannable: do not paste huge paragraphs into engines — compress into signals + short body.
- executiveStrategic is the premium command view: sharp, decisive Russian; no fluff.`;

export function buildCompetitorIntelligenceSystemPrompt(): string {
  return [
    "You are VOKRA Competitor Intelligence — an autonomous strategic OS for Wildberries/Ozon fashion domination.",
    "PRIMARY INPUT (always): marketplace search query + marketplace selector + screenshots. Treat these as the main ground truth.",
    "OPTIONAL INPUT: pasted competitor text or extra product context may appear in a separate 'Advanced Strategic Controls' block. If absent or empty, do not ask for it — infer target audience, price segment, positioning, tone, visual category, fashion style, conversion risks, SEO angle, and marketplace positioning from the query + vision.",
    "VOKRA does not live-scrape listings in this module: never claim you fetched URLs. Screenshots and pasted snippets are the only evidence.",
    "LANGUAGE: all human-readable string values in Russian. Hybrid English allowed for standard terms: CTR, SEO, SKU, FBO, DTF, visual clutter, premium streetwear.",
    "OUTPUT SHAPE: six named engines (Market Pattern, Visual Psychology, CTR Intelligence, SEO Structure, Positioning Gap, VOKRA Winning Blueprint) plus executiveStrategic hero block and inferredBrief. Also fill legacy blocks (executiveSummary, patternMap, layers, scores, blueprint, SEO, creative) for exports and memory — keep them consistent with engines.",
    "Tone: direct, operational, premium neo-noir strategist — no motivational filler.",
    buildStrategicDateSystemBlock(),
    JSON_CONTRACT_V2,
    VOKRA_VOICE_RULES_EN,
  ].join("\n\n");
}

export type CompetitorUserContext = {
  query: string;
  marketplace: "wildberries" | "ozon" | "both";
  pastedTitlesDesc: string;
  pastedPricesRatings: string;
  pastedLinksNotes: string;
  productIdea: string;
  targetCustomer: string;
  priceRange: string;
  brandStyle: string;
  constraints: string;
  dtfNotes: string;
  imageRolesSummary: string;
};

function hasAdvancedContext(ctx: CompetitorUserContext): boolean {
  return [
    ctx.pastedTitlesDesc,
    ctx.pastedPricesRatings,
    ctx.pastedLinksNotes,
    ctx.productIdea,
    ctx.targetCustomer,
    ctx.priceRange,
    ctx.brandStyle,
    ctx.constraints,
    ctx.dtfNotes,
  ].some((s) => String(s || "").trim().length > 0);
}

export function buildCompetitorUserMessage(ctx: CompetitorUserContext): string {
  const core = [
    buildStrategicDateUserLine(),
    "",
    "## Основной ввод (минимум)",
    `Поисковый запрос (как на маркетплейсе): ${ctx.query || "—"}`,
    `Маркетплейс: ${ctx.marketplace}`,
    "",
    "## Скриншоты",
    ctx.imageRolesSummary,
    "",
  ];

  if (hasAdvancedContext(ctx)) {
    core.push(
      "## Advanced Strategic Controls (дополнительно — усиль сигнал, не требуй обратно)",
      "### Вставленные данные конкурентов",
      "Тайтлы / описания:",
      ctx.pastedTitlesDesc || "—",
      "",
      "Цены / рейтинги / отзывы:",
      ctx.pastedPricesRatings || "—",
      "",
      "Ссылки и заметки:",
      ctx.pastedLinksNotes || "—",
      "",
      "### Контекст VOKRA (если пользователь указал)",
      `Идея продукта: ${ctx.productIdea || "—"}`,
      `Целевой покупатель: ${ctx.targetCustomer || "—"}`,
      `Ценовой коридор: ${ctx.priceRange || "—"}`,
      `Стиль бренда: ${ctx.brandStyle || "—"}`,
      `Ограничения производства: ${ctx.constraints || "—"}`,
      `DTF / принт: ${ctx.dtfNotes || "—"}`,
      "",
    );
  } else {
    core.push(
      "Пользователь не заполнял расширенные поля — выведи inferredBrief и engines строго из запроса и скриншотов.",
      "",
    );
  }

  core.push(
    "Заполни JSON по контракту schemaVersion 2. Слои layers должны согласовываться с engines. Верни только JSON.",
  );

  return core.join("\n");
}
