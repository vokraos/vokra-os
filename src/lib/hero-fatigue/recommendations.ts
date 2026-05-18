import type { CompetitiveGapAnalysis } from "../competitive-gap/types";
import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";

export function buildFatigueRecommendations(
  fieldIdx: number,
  ourIdx: number | null,
  urgency: number,
  semanticRep: number,
  gap: CompetitiveGapAnalysis | null,
  heroPlan: CompetitiveHeroImprovementPlan | null,
  archetype: HeroArchetypeIntelligenceReport | null,
  readability: HeroReadabilityIntelligenceReport | null,
  t: (key: string, vars?: Record<string, string>) => string,
): string[] {
  const out: string[] = [];
  if (semanticRep >= 52) out.push(t("hf.pr.semantic_reduce"));
  if (fieldIdx >= 62) out.push(t("hf.pr.corridor_blend"));
  if (ourIdx != null && ourIdx >= fieldIdx - 5 && ourIdx <= fieldIdx + 8 && fieldIdx >= 58) out.push(t("hf.pr.refresh_before_peak"));
  if (readability?.readabilityRiskLine && /risk|риск/i.test(readability.readabilityRiskLine)) out.push(t("hf.pr.readability_refresh"));
  else if (readability && readability.readabilityPressureIndex < 48 && ourIdx != null && ourIdx < 55) {
    out.push(t("hf.pr.partial_only"));
  }
  if (archetype?.overlapRiskLine) out.push(t("hf.pr.overlap", { line: archetype.overlapRiskLine.slice(0, 120) }));
  if (gap?.visualGap?.trim()) out.push(t("hf.pr.gap_echo", { line: gap.visualGap.slice(0, 120) }));
  if (heroPlan?.nextActions?.[0]) out.push(t("hf.pr.plan_echo", { line: heroPlan.nextActions[0]!.slice(0, 120) }));

  if (urgency >= 64) out.push(t("hf.rec.lighting"));
  if (urgency >= 58) out.push(t("hf.rec.color"));
  if (urgency >= 52) out.push(t("hf.rec.typography"));
  if (semanticRep >= 48) out.push(t("hf.rec.model_pose"));

  if (out.length < 5) {
    out.push(t("hf.rec.premium_proof"));
    out.push(t("hf.rec.readability_refresh"));
  }
  return [...new Set(out)].slice(0, 12);
}
