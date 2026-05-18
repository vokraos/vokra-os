import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import { newHeroImprovementPlanId } from "../hero-improvement-plan/ids";
import type { CompetitiveGapAnalysis } from "./types";

export function mergeHeroPlanWithGap(
  base: CompetitiveHeroImprovementPlan,
  gap: CompetitiveGapAnalysis,
  t: (key: string, vars?: Record<string, string>) => string,
): CompetitiveHeroImprovementPlan {
  const extraWeak = gap.weaknessPoints.slice(0, 3).filter(Boolean);
  const mergedWeak = [...extraWeak, ...base.visualWeaknesses].slice(0, 8);
  const mergedRisks = [...new Set([...gap.riskFlags, ...base.riskFlags])].slice(0, 12);
  const augment = gap.recommendedChanges.slice(0, 5).join(" · ");
  return {
    ...base,
    id: newHeroImprovementPlanId(),
    visualWeaknesses: mergedWeak,
    riskFlags: mergedRisks,
    promptDirection: `${base.promptDirection} · ${t("gap.heroPlanAugment", { gap: augment.slice(0, 400) })}`.slice(0, 1200),
    nextActions: [...gap.nextActions, ...base.nextActions].slice(0, 14),
    expectedEffect: `${base.expectedEffect} ${t("gap.heroPlanEffectAugment")}`.slice(0, 500),
  };
}
