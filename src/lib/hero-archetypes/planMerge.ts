import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import { newHeroImprovementPlanId } from "../hero-improvement-plan/ids";
import type { HeroArchetypeIntelligenceReport } from "./types";

export function mergeHeroPlanWithArchetypeIntel(
  plan: CompetitiveHeroImprovementPlan,
  report: HeroArchetypeIntelligenceReport,
  t: (key: string, vars?: Record<string, string>) => string,
): CompetitiveHeroImprovementPlan {
  const extra = report.practicalRecommendations.slice(0, 3);
  const mergedNext = [...report.practicalRecommendations.slice(0, 2), ...plan.nextActions].slice(0, 14);
  const archNote = t("ha.plan.augment", { line: report.recommendedDirectionLine.slice(0, 200) });
  return {
    ...plan,
    id: newHeroImprovementPlanId(),
    promptDirection: `${plan.promptDirection} · ${archNote}`.slice(0, 1200),
    recommendedHeroDirection: `${plan.recommendedHeroDirection} ${report.vokraPrimaryDirectionLine}`.slice(0, 600),
    nextActions: mergedNext,
    riskFlags: [...new Set([...plan.riskFlags, ...extra])].slice(0, 12),
    expectedEffect: `${plan.expectedEffect} ${t("ha.plan.effect")}`.slice(0, 500),
  };
}
