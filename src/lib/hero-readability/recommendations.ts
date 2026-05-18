import type { CompetitiveGapAnalysis } from "../competitive-gap/types";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import type { SerpDerivedAnalysis } from "../competitor-serp/types";

export function buildReadabilityRecommendations(
  analysis: SerpDerivedAnalysis,
  overloadPct: number,
  gap: CompetitiveGapAnalysis | null,
  heroPlan: CompetitiveHeroImprovementPlan | null,
  archetype: HeroArchetypeIntelligenceReport | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const out: string[] = [];
  const lowPrint = analysis.printReadabilityBuckets[0]?.sharePct ?? 0;
  const highPrint = analysis.printReadabilityBuckets[2]?.sharePct ?? 0;

  if (overloadPct >= 42) out.push(t("hr.pr.field_overloaded"));
  if (lowPrint >= 45) out.push(t("hr.pr.field_print_weak", { pct: String(lowPrint) }));
  if (highPrint <= 22 && lowPrint < 40) out.push(t("hr.pr.clean_hierarchy_under"));
  if (overloadPct >= 30 && lowPrint < 50) out.push(t("hr.pr.mobile_stack"));

  if (gap?.readabilityGap?.trim()) out.push(t("hr.pr.gap_echo", { line: gap.readabilityGap.slice(0, 160) }));

  if (heroPlan?.riskFlags?.length) {
    const joined = heroPlan.riskFlags.slice(0, 2).join(" · ");
    if (/print|читаем|read/i.test(joined)) out.push(t("hr.pr.hero_plan_print"));
  }

  if (archetype?.overlapRiskLine) out.push(t("hr.pr.archetype_lane", { line: archetype.overlapRiskLine.slice(0, 140) }));

  if (analysis.saturationSignal >= 62) out.push(t("hr.pr.saturation_readability"));

  if (out.length < 4) {
    if (lowPrint >= 35) out.push(t("hr.rec.print_scale"));
    else out.push(t("hr.rec.premium_readability_opp"));
  }

  return [...new Set(out)].slice(0, 10);
}

export function weakReadabilityCompetitorLines(
  analysis: SerpDerivedAnalysis,
  overloadPct: number,
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const lines: string[] = [];
  const low = analysis.printReadabilityBuckets[0]?.sharePct ?? 0;
  if (low >= 38) lines.push(t("hr.weak.print_unreadable", { pct: String(low) }));
  if (overloadPct >= 40) lines.push(t("hr.weak.overloaded_majority", { pct: String(overloadPct) }));
  if (lines.length === 0) lines.push(t("hr.weak.no_clear_pocket"));
  return lines;
}
