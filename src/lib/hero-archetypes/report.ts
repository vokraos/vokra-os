import type { CompetitiveGapAnalysis, OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import { aggregateSerpArchetypes, dominantArchetypes } from "./classify";
import { compareOurVsSerp } from "./compare";
import { newHeroArchetypeIntelligenceId } from "./ids";
import { buildOverlapRiskLine, buildOverlapSummary } from "./overlap";
import {
  archetypePressureSummary,
  practicalRecommendations,
  recommendedDirectionLine,
  vokraFitLines,
  vokraPrimaryDirectionLine,
} from "./recommendations";
import { buildSaturationSummary, underrepresentedLines, weakArchetypeLines } from "./saturation";
import type { HeroArchetypeIntelligenceReport, MarketplaceHeroArchetype } from "./types";

export function buildHeroArchetypeIntelligenceReport(
  envelope: CompetitorSerpEnvelope,
  ctx: {
    ourCard?: OurCardCompetitiveSnapshot | null;
    gap?: CompetitiveGapAnalysis | null;
    heroPlan?: CompetitiveHeroImprovementPlan | null;
  },
  t: (key: string, vars?: Record<string, string>) => string,
): HeroArchetypeIntelligenceReport {
  const items = envelope.snapshot.items;
  const shares = aggregateSerpArchetypes(items);
  const dom = dominantArchetypes(shares, 5);
  const dominantSerpLines = dom.map((s) =>
    t("ha.dom.line", { arch: t(`ha.arch.${s.archetype}`), pct: String(s.sharePct) }),
  );
  const saturationSummary = buildSaturationSummary(shares, envelope.analysis, t);
  const cmp = compareOurVsSerp(ctx.ourCard ?? null, shares, t);
  const ourTop = cmp.ourArchetypes[0]?.archetype ?? null;
  const overlapSummary = buildOverlapSummary(shares, ourTop, t);
  const overlapRiskLine = buildOverlapRiskLine(shares, ourTop, t);
  const weakLines = weakArchetypeLines(shares, t);
  const under = underrepresentedLines(shares, t);
  const recDir = recommendedDirectionLine(shares, t);
  const vokraPrimary = vokraPrimaryDirectionLine(t);
  const vokraFit = vokraFitLines(shares, ourTop, t);
  const practical = practicalRecommendations(shares, ourTop, overlapRiskLine, ctx.gap ?? null, ctx.heroPlan ?? null, t);
  const pressure = archetypePressureSummary(shares, envelope.analysis.saturationSignal, t);

  return {
    id: newHeroArchetypeIntelligenceId(),
    sourceSerpSnapshotId: envelope.snapshot.id,
    query: envelope.snapshot.query,
    marketplace: envelope.snapshot.marketplace,
    createdAt: Date.now(),
    dominantSerpArchetypes: dom,
    dominantSerpLines,
    saturationSummary,
    overlapSummary,
    archetypePressureSummary: pressure,
    weakArchetypeLines: weakLines,
    underrepresentedLines: under,
    ourArchetypes: cmp.ourArchetypes,
    ourArchetypeLines: cmp.ourArchetypeLines,
    overlapRiskLine,
    differentiationOpportunityLine: cmp.differentiationOpportunityLine,
    premiumMismatchLine: cmp.premiumMismatchLine,
    emotionalMismatchLine: cmp.emotionalMismatchLine,
    marketplaceFitLine: cmp.marketplaceFitLine,
    recommendedDirectionLine: recDir,
    vokraPrimaryDirectionLine: vokraPrimary,
    vokraFitLines: vokraFit,
    practicalRecommendations: practical,
  };
}

export function topMarketplaceArchetypeForPrompt(shares: readonly { archetype: MarketplaceHeroArchetype; sharePct: number }[]): MarketplaceHeroArchetype {
  return shares[0]?.archetype ?? "clean_marketplace";
}
