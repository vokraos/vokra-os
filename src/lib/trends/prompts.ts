import { buildStrategicDateSystemBlock, buildStrategicDateUserLine } from "../ai/strategicDateContext";
import { VOKRA_VOICE_RULES_EN } from "../ai/voice";

const JSON_CONTRACT = `Return ONE JSON object only (no markdown fences, no commentary). Schema:
{
  "schemaVersion": 1,
  "executiveSummary": {
    "marketTemperature": string,
    "opportunityLevel": string,
    "recommendedMove": string,
    "riskLevel": string,
    "timingUrgency": string,
    "bestStrategicAngle": string
  },
  "layers": {
    "marketDemandSignals": { "summary": string, "bullets": string[] },
    "trendPatterns": { "summary": string, "bullets": string[] },
    "marketplaceOpportunity": { "summary": string, "bullets": string[] },
    "productOpportunity": { "summary": string, "bullets": string[] },
    "creativeOpportunity": { "summary": string, "bullets": string[] },
    "businessPriority": { "summary": string, "bullets": string[] }
  },
  "trendCards": [
    {
      "trendName": string,
      "trendType": string,
      "whyItMatters": string,
      "targetAudience": string,
      "emotionalTrigger": string,
      "marketplacePotential": string,
      "visualDirection": string,
      "productIdeas": string[],
      "seoAngle": string,
      "contentAngle": string,
      "risk": string,
      "launchSpeed": string,
      "priorityScore": number
    }
  ],
  "opportunityMap": {
    "highDemandLowQualityCompetition": string,
    "premiumGap": string,
    "giftGap": string,
    "seoGap": string,
    "visualFatigue": string,
    "underservedAudience": string,
    "fastLaunchIdeas": string,
    "longTermBrandIdeas": string
  },
  "productConcepts": [
    {
      "name": string,
      "printIdea": string,
      "productType": string,
      "targetCustomer": string,
      "marketplacePositioning": string,
      "visualStyle": string,
      "seoCluster": string,
      "richContentDirection": string,
      "reelsHook": string,
      "launchDifficulty": string,
      "expectedPotential": string
    }
  ],
  "actionPlan": {
    "launchFirst": string,
    "testSecond": string,
    "avoid": string,
    "watch": string,
    "prepareSeasonally": string
  },
  "agentRecommendations": {
    "trendHunter": { "headline": string, "signals": string[], "body": string, "moves": string[] },
    "marketplaceStrategist": { "headline": string, "signals": string[], "body": string, "moves": string[] },
    "creativeDirector": { "headline": string, "signals": string[], "body": string, "moves": string[] },
    "seoAnalyst": { "headline": string, "signals": string[], "body": string, "moves": string[] },
    "productionPlanner": { "headline": string, "signals": string[], "body": string, "moves": string[] },
    "profitBrain": { "headline": string, "signals": string[], "body": string, "moves": string[] }
  },
  "scores": {
    "demandPotential": number,
    "trendFreshness": number,
    "giftPotential": number,
    "premiumPotential": number,
    "seoOpportunity": number,
    "visualOpportunity": number,
    "productionEase": number,
    "scalingPotential": number,
    "marginPotential": number,
    "vokraFit": number
  }
}
Rules:
- schemaVersion MUST be 1.
- All timing fields (e.g. timingUrgency, launchSpeed, actionPlan.prepareSeasonally, any seasonal “windows”) MUST align with the CLOCK in the system message: current year and upcoming months from today, or «ближайшие 30–90 дней» / “next 30–90 days” when exact dates would be invented. NEVER obsolete past-year month ranges unless the user explicitly asks for historical analysis.
- All scores 0–100 integers.
- trendCards: 4–10 items; productConcepts: 4–8 items.
- Each layer bullets: 4–10 concise strings.
- Agent cards: 3–6 signals (short labels), body 2–4 sentences, moves 3–6 bullets.
- Do NOT claim scraped TikTok/WB/Ozon data — only infer from user input and images.`;

export function buildTrendRadarSystemPrompt(): string {
  return [
    "You are VOKRA Trend Radar — strategic intelligence for fashion marketplace brands (Wildberries, Ozon, social-led demand).",
    "V1 is evidence-bound: user niche/keywords, optional pasted observations (social, marketplace, competitors, seasonal notes), and optional screenshots. There is NO live web scraping, TikTok API, WB/Ozon API, or automated parsing in this build.",
    "If evidence is thin, say so briefly in layer summaries and still deliver best-effort strategic synthesis — label uncertainty.",
    "LANGUAGE: all human-readable string values in Russian. Hybrid English allowed for standard terms: SEO, CTR, SKU, DTF, reels, premium streetwear, gift-occasion.",
    "Think in six strategic layers (inside JSON.layers), then trendCards, opportunityMap, productConcepts, actionPlan, and six agent personas — each agent must add a distinct lens, not duplicate prose.",
    "Prioritize discoverable opportunities before competitors: demand direction, emotional/gift/seasonal angles, gaps (search/visual/SEO/offer/premium/gift), and VOKRA-native print-led SKUs.",
    buildStrategicDateSystemBlock(),
    JSON_CONTRACT,
    VOKRA_VOICE_RULES_EN,
  ].join("\n\n");
}

export type TrendRadarUserContext = {
  niche: string;
  marketplaceFocus: "wildberries" | "ozon" | "social" | "all";
  seasonEvent: string;
  targetAudience: string;
  priceSegment: string;
  brandStyle: string;
  productionConstraints: string;
  pastedSocialTrends: string;
  pastedMarketplaceObservations: string;
  pastedCompetitorIdeas: string;
  imageSummary: string;
};

function hasAdvanced(ctx: TrendRadarUserContext): boolean {
  return [
    ctx.seasonEvent,
    ctx.targetAudience,
    ctx.priceSegment,
    ctx.brandStyle,
    ctx.productionConstraints,
    ctx.pastedSocialTrends,
    ctx.pastedMarketplaceObservations,
    ctx.pastedCompetitorIdeas,
  ].some((s) => String(s || "").trim().length > 0);
}

export function buildTrendRadarUserMessage(ctx: TrendRadarUserContext): string {
  const core = [
    buildStrategicDateUserLine(),
    "",
    "## Основной ввод",
    `Ниша / запрос / категория: ${ctx.niche || "—"}`,
    `Фокус маркетплейсов: ${ctx.marketplaceFocus}`,
    "",
    "## Скриншоты",
    ctx.imageSummary,
    "",
  ];

  if (hasAdvanced(ctx)) {
    core.push(
      "## Расширенные настройки стратегии",
      `Сезон / событие: ${ctx.seasonEvent || "—"}`,
      `Целевая аудитория: ${ctx.targetAudience || "—"}`,
      `Ценовой сегмент: ${ctx.priceSegment || "—"}`,
      `Стиль бренда: ${ctx.brandStyle || "—"}`,
      `Ограничения производства: ${ctx.productionConstraints || "—"}`,
      "",
      "### Соцтренды (вставка)",
      ctx.pastedSocialTrends || "—",
      "",
      "### Наблюдения с маркетплейсов",
      ctx.pastedMarketplaceObservations || "—",
      "",
      "### Идеи / паттерны конкурентов",
      ctx.pastedCompetitorIdeas || "—",
      "",
    );
  } else {
    core.push("Расширенные поля не заполнены — выведи слои и карточки из ниши и скриншотов (если есть).", "");
  }

  core.push("Заполни JSON по контракту. Верни только JSON.");
  return core.join("\n");
}
