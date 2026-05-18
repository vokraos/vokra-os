import type { CompetitorAnalysisResult } from "./types";
import { COMPETITOR_ENGINE_IDS } from "./agents";

function bulletsMd(title: string, items: string[]) {
  if (!items.length) return "";
  return `### ${title}\n${items.map((x) => `- ${x}`).join("\n")}\n\n`;
}

function engineMd(name: string, e: { signals: string[]; headline: string; body: string; moves: string[] }) {
  const sig = e.signals.length ? `**Signals:** ${e.signals.join(" · ")}\n\n` : "";
  const moves = e.moves.length ? `${bulletsMd("Moves", e.moves)}` : "";
  return `## ${name}\n\n${sig}**${e.headline}**\n\n${e.body}\n\n${moves}\n`;
}

export function competitorAnalysisToMarkdown(r: CompetitorAnalysisResult): string {
  const ex = r.executiveSummary;
  const es = r.executiveStrategic;
  const inf = r.inferredBrief;
  const lines: string[] = [
    "# VOKRA · Competitor Intelligence",
    "",
    `> schema v${r.schemaVersion}`,
    "",
    "## Executive command",
    `- **Насыщенность рынка:** ${es.marketSaturation}`,
    `- **Уровень возможности:** ${es.opportunityLevel}`,
    `- **Давление конкуренции:** ${es.competitionPressure}`,
    `- **Доминирующий архетип:** ${es.dominantMarketArchetype}`,
    `- **Лучший вход для VOKRA:** ${es.bestOpeningForVokra}`,
    "",
    "## Авто-профиль (inferred)",
    `- **Аудитория:** ${inf.targetAudience}`,
    `- **Ценовой сегмент:** ${inf.priceSegment}`,
    `- **Позиционирование:** ${inf.positioning}`,
    `- **Эмоциональный тон:** ${inf.emotionalTone}`,
    `- **Визуальная категория:** ${inf.visualCategory}`,
    `- **Fashion-стиль:** ${inf.fashionStyle}`,
    `- **Конверсионные риски:** ${inf.likelyConversionIssues}`,
    `- **SEO-стратегия:** ${inf.seoStrategy}`,
    `- **Позиция на МП:** ${inf.marketplacePositioning}`,
    "",
  ];

  for (const id of COMPETITOR_ENGINE_IDS) {
    lines.push(engineMd(id.replace(/([A-Z])/g, " $1").trim(), r.engines[id]));
  }

  lines.push(
    "## Executive summary (legacy block)",
    `- **Сложность рынка:** ${ex.marketDifficulty}`,
    `- **Окно:** ${ex.opportunity}`,
    `- **Угол:** ${ex.recommendedAngle}`,
    `- **Риск:** ${ex.riskLevel}`,
    `- **Креативный вектор:** ${ex.creativeDirection}`,
    "",
    "## Pattern map",
    bulletsMd("Visual", r.patternMap.visual) +
      bulletsMd("SEO", r.patternMap.seo) +
      bulletsMd("Offer", r.patternMap.offer) +
      bulletsMd("Emotional", r.patternMap.emotional),
    "## Weaknesses to exploit",
    ...(r.weaknessesToExploit.length ? r.weaknessesToExploit.map((x) => `- ${x}`) : ["- —"]),
    "",
    "## VOKRA winning strategy",
    `**Positioning:** ${r.vokraWinningStrategy.positioning}`,
    "",
    `**Main photo:** ${r.vokraWinningStrategy.mainPhotoConcept}`,
    "",
    `**SEO angle:** ${r.vokraWinningStrategy.seoAngle}`,
    "",
    `**Rich content:** ${r.vokraWinningStrategy.richContentStructure}`,
    "",
    `**Offer framing:** ${r.vokraWinningStrategy.offerFraming}`,
    "",
    `**Reels:** ${r.vokraWinningStrategy.reelsDirection}`,
    "",
    `**Campaign hook:** ${r.vokraWinningStrategy.campaignHook}`,
    "",
    "## Card blueprint",
    `**Main:** ${r.cardBlueprint.mainPhoto}`,
    "",
    `**Second:** ${r.cardBlueprint.secondImage}`,
    "",
    ...r.cardBlueprint.slides.map((s, i) => `- Slide ${i + 1}: ${s}`),
    "",
    `**Notes:** ${r.cardBlueprint.notes}`,
    "",
    "## SEO reconstruction",
    `**Title:** ${r.seoReconstruction.bestTitle}`,
    "",
    "**Clusters:**",
    ...r.seoReconstruction.keywordClusters.map((c) => `- ${c}`),
    "",
    "### WB",
    r.seoReconstruction.wbDescription,
    "",
    "### Ozon",
    r.seoReconstruction.ozonDescription,
    "",
    "### Anti-spam",
    ...r.seoReconstruction.antiSpamRecommendations.map((x) => `- ${x}`),
    "",
    "## Creative reconstruction",
    "### Fashion photo",
    r.creativeReconstruction.fashionPhotoPrompt,
    "",
    "### Marketplace main",
    r.creativeReconstruction.marketplaceMainPhotoPrompt,
    "",
    "### Lifestyle",
    r.creativeReconstruction.lifestylePrompt,
    "",
    "### Rich content",
    r.creativeReconstruction.richContentPrompts,
    "",
    "### Reels",
    r.creativeReconstruction.reelsPrompt,
    "",
    "### Campaign",
    r.creativeReconstruction.campaignPrompt,
    "",
    "## Six layers",
  );

  const L = r.layers;
  const layerBlocks: [string, typeof L.searchResultStructure][] = [
    ["Search / feed structure", L.searchResultStructure],
    ["Visual competition", L.visualCompetition],
    ["SEO competition", L.seoCompetition],
    ["Offer competition", L.offerCompetition],
    ["Psychology", L.psychology],
    ["Gap analysis", L.gapAnalysis],
  ];
  for (const [name, block] of layerBlocks) {
    lines.push(`### ${name}`, "", block.summary, "");
    for (const b of block.bullets) lines.push(`- ${b}`);
    lines.push("");
  }

  const s = r.opportunityScores;
  lines.push(
    "## Scores (0–100)",
    `- competitionIntensity: ${s.competitionIntensity}`,
    `- visualOpportunity: ${s.visualOpportunity}`,
    `- seoOpportunity: ${s.seoOpportunity}`,
    `- trendPotential: ${s.trendPotential}`,
    `- giftPotential: ${s.giftPotential}`,
    `- premiumPotential: ${s.premiumPotential}`,
    `- vokraFit: ${s.vokraFit}`,
    `- executionDifficulty: ${s.executionDifficulty}`,
    "",
  );

  return lines.join("\n");
}
