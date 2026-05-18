import type { TrendRadarResult } from "./types";

function bullets(title: string, items: string[]) {
  if (!items.length) return "";
  return `### ${title}\n${items.map((x) => `- ${x}`).join("\n")}\n\n`;
}

export function trendRadarToMarkdown(r: TrendRadarResult): string {
  const ex = r.executiveSummary;
  const lines: string[] = [
    "# VOKRA · Trend Radar",
    "",
    "## Executive opportunity summary",
    `- **Температура рынка:** ${ex.marketTemperature}`,
    `- **Уровень возможности:** ${ex.opportunityLevel}`,
    `- **Рекомендованный ход:** ${ex.recommendedMove}`,
    `- **Риск:** ${ex.riskLevel}`,
    `- **Срочность по таймингу:** ${ex.timingUrgency}`,
    `- **Лучший стратегический угол:** ${ex.bestStrategicAngle}`,
    "",
    "## Scores (0–100)",
    ...Object.entries(r.scores).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## Trend cards",
  ];

  for (const c of r.trendCards) {
    lines.push(
      `### ${c.trendName}`,
      `- type: ${c.trendType}`,
      `- priority: ${c.priorityScore}`,
      "",
      c.whyItMatters,
      "",
      `**Audience:** ${c.targetAudience}`,
      `**Trigger:** ${c.emotionalTrigger}`,
      `**MP potential:** ${c.marketplacePotential}`,
      `**Visual:** ${c.visualDirection}`,
      "",
      "**Product ideas:**",
      ...c.productIdeas.map((x) => `- ${x}`),
      "",
      `**SEO:** ${c.seoAngle}`,
      `**Content:** ${c.contentAngle}`,
      `**Risk:** ${c.risk} · **Launch speed:** ${c.launchSpeed}`,
      "",
    );
  }

  const om = r.opportunityMap;
  lines.push(
    "## Opportunity map",
    `- highDemandLowQualityCompetition: ${om.highDemandLowQualityCompetition}`,
    `- premiumGap: ${om.premiumGap}`,
    `- giftGap: ${om.giftGap}`,
    `- seoGap: ${om.seoGap}`,
    `- visualFatigue: ${om.visualFatigue}`,
    `- underservedAudience: ${om.underservedAudience}`,
    `- fastLaunchIdeas: ${om.fastLaunchIdeas}`,
    `- longTermBrandIdeas: ${om.longTermBrandIdeas}`,
    "",
    "## Product concepts",
  );

  for (const p of r.productConcepts) {
    lines.push(
      `### ${p.name}`,
      `- print: ${p.printIdea}`,
      `- type: ${p.productType}`,
      `- customer: ${p.targetCustomer}`,
      `- positioning: ${p.marketplacePositioning}`,
      `- visual: ${p.visualStyle}`,
      `- SEO cluster: ${p.seoCluster}`,
      `- rich: ${p.richContentDirection}`,
      `- reels: ${p.reelsHook}`,
      `- difficulty: ${p.launchDifficulty}`,
      `- potential: ${p.expectedPotential}`,
      "",
    );
  }

  const ap = r.actionPlan;
  lines.push(
    "## AI action plan",
    `**Launch first:** ${ap.launchFirst}`,
    "",
    `**Test second:** ${ap.testSecond}`,
    "",
    `**Avoid:** ${ap.avoid}`,
    "",
    `**Watch:** ${ap.watch}`,
    "",
    `**Seasonal prep:** ${ap.prepareSeasonally}`,
    "",
    "## Agent recommendations",
  );

  for (const [role, ag] of Object.entries(r.agentRecommendations)) {
    lines.push(`### ${role}`, ag.headline, "", ag.body, "", bullets("Signals", ag.signals), bullets("Moves", ag.moves));
  }

  const L = r.layers;
  lines.push("## Strategic layers", "");
  const blocks: [string, (typeof L)["marketDemandSignals"]][] = [
    ["Market demand signals", L.marketDemandSignals],
    ["Trend patterns", L.trendPatterns],
    ["Marketplace opportunity", L.marketplaceOpportunity],
    ["Product opportunity", L.productOpportunity],
    ["Creative opportunity", L.creativeOpportunity],
    ["Business priority", L.businessPriority],
  ];
  for (const [name, block] of blocks) {
    lines.push(`### ${name}`, "", block.summary, "");
    for (const b of block.bullets) lines.push(`- ${b}`);
    lines.push("");
  }

  return lines.join("\n");
}
