import type { CompetitiveGapAnalysis, OurCardCompetitiveSnapshot } from "../competitive-gap/types";
import type { CompetitorSerpEnvelope } from "../competitor-serp/types";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import { compareOurReadabilityVsSerp } from "./compare";
import { newHeroReadabilityIntelligenceId } from "./ids";
import { focalCompetitionScore, readabilityPressureIndex } from "./pressure";
import { buildReadabilityRecommendations, weakReadabilityCompetitorLines as weakReadabilityBullets } from "./recommendations";
import {
  buildOurReadabilityEntity,
  compositeRowReadabilityScore,
  dominantReadabilityLevel,
  fieldAverageReadabilityScore,
  overloadedHeroSharePct,
  premiumReadabilitySharePct,
} from "./readability";
import type { HeroReadabilityIntelligenceReport } from "./types";

export function buildHeroReadabilityIntelligenceReport(
  envelope: CompetitorSerpEnvelope,
  ctx: {
    ourCard?: OurCardCompetitiveSnapshot | null;
    gap?: CompetitiveGapAnalysis | null;
    heroPlan?: CompetitiveHeroImprovementPlan | null;
    archetypeIntel?: HeroArchetypeIntelligenceReport | null;
  },
  t: (key: string, vars?: Record<string, string>) => string,
): HeroReadabilityIntelligenceReport {
  const items = envelope.snapshot.items;
  const analysis = envelope.analysis;
  const overloadPct = overloadedHeroSharePct(items);
  const fieldAvg = fieldAverageReadabilityScore(items);
  const dom = dominantReadabilityLevel(items);
  const focal = focalCompetitionScore(analysis, items.length);
  const pressure = readabilityPressureIndex({
    fieldAvgReadability: fieldAvg,
    saturationSignal: analysis.saturationSignal,
    overloadSharePct: overloadPct,
    focalCompetition: focal,
  });

  const sorted = [...items].sort((a, b) => compositeRowReadabilityScore(a) - compositeRowReadabilityScore(b));
  const worst = sorted.slice(0, Math.min(3, sorted.length));

  const dominantSerpReadabilityLines: string[] = [];
  if (dom) {
    dominantSerpReadabilityLines.push(
      t("hr.dom.level_mass", { level: t(`hr.level.${dom.level}`), pct: String(dom.sharePct) }),
    );
  }
  dominantSerpReadabilityLines.push(
    t("hr.dom.avg_score", { score: String(fieldAvg) }),
    t("hr.dom.bucket_low", { pct: String(analysis.printReadabilityBuckets[0]?.sharePct ?? 0) }),
    t("hr.dom.bucket_high", { pct: String(analysis.printReadabilityBuckets[2]?.sharePct ?? 0) }),
  );

  const dominantFieldQualityLine = t("hr.field.quality", {
    level: dom ? t(`hr.level.${dom.level}`) : t("hr.level.acceptable"),
    low: String(analysis.printReadabilityBuckets[0]?.sharePct ?? 0),
    overload: String(overloadPct),
  });

  const readabilityPressureSummary = t("hr.pressure.summary", { idx: String(pressure), focal: String(focal) });

  const overloadedHeroLine = t("hr.line.overload", { pct: String(overloadPct) });
  const weakPrintVisibilityLine = t("hr.line.weak_print", { pct: String(analysis.printReadabilityBuckets[0]?.sharePct ?? 0) });
  const premiumReadabilityShareLine = t("hr.line.premium_read", { pct: String(premiumReadabilitySharePct(items)) });
  const visualNoisePressureLine = t("hr.line.noise_pressure", { sat: String(analysis.saturationSignal) });
  const focalCompetitionLine = t("hr.line.focal", { score: String(focal) });

  const weakReadabilityCompetitorLines = [
    ...weakReadabilityBullets(analysis, overloadPct, t),
    ...worst.map((it, i) =>
      t("hr.weak.row", {
        n: String(i + 1),
        score: String(compositeRowReadabilityScore(it)),
        note: (it.heroImageNote || it.visualPattern).slice(0, 72),
      }),
    ),
  ].slice(0, 6);

  const cmp = compareOurReadabilityVsSerp(ctx.ourCard ?? null, items, t);
  const ourEntity = ctx.ourCard ? buildOurReadabilityEntity(ctx.ourCard, fieldAvg, t) : null;

  const archetypeCross =
    ctx.archetypeIntel?.practicalRecommendations?.[0] != null
      ? t("hr.cross.archetype", { line: ctx.archetypeIntel.practicalRecommendations[0]!.slice(0, 140) })
      : null;

  const practical = buildReadabilityRecommendations(
    analysis,
    overloadPct,
    ctx.gap ?? null,
    ctx.heroPlan ?? null,
    ctx.archetypeIntel ?? null,
    t,
  );

  return {
    id: newHeroReadabilityIntelligenceId(),
    sourceSerpSnapshotId: envelope.snapshot.id,
    query: envelope.snapshot.query,
    marketplace: envelope.snapshot.marketplace,
    createdAt: Date.now(),
    readabilityPressureIndex: pressure,
    dominantSerpReadabilityLines,
    dominantFieldQualityLine,
    readabilityPressureSummary,
    overloadedHeroLine,
    weakPrintVisibilityLine,
    premiumReadabilityShareLine,
    visualNoisePressureLine,
    focalCompetitionLine,
    weakReadabilityCompetitorLines,
    ourReadabilityLines: cmp.ourLines,
    ourReadabilityEntity: ourEntity,
    readabilityGapLine: cmp.gapLine,
    mobileClarityLine: cmp.mobileLine,
    readabilityRiskLine: cmp.riskLine,
    archetypeReadabilityCrossLine: archetypeCross,
    practicalRecommendations: practical,
  };
}
