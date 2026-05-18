import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import { newHeroImprovementPlanId } from "../hero-improvement-plan/ids";
import type { HeroFatigueIntelligenceReport } from "./types";

export function mergeHeroPlanWithFatigueIntel(
  plan: CompetitiveHeroImprovementPlan,
  report: HeroFatigueIntelligenceReport,
  t: (key: string, vars?: Record<string, string>) => string,
): CompetitiveHeroImprovementPlan {
  const warn = report.visualBlindnessRiskLine;
  const extras = report.practicalRecommendations.slice(0, 3);
  const note = t("hf.plan.augment", { line: report.refreshUrgencyLine.slice(0, 180) });
  return {
    ...plan,
    id: newHeroImprovementPlanId(),
    promptDirection: `${plan.promptDirection} · ${note}`.slice(0, 1200),
    negativeConstraints: `${plan.negativeConstraints} · ${t("hf.plan.neg", { line: warn.slice(0, 200) })}`.slice(0, 1600),
    riskFlags: [...new Set([...plan.riskFlags, report.refreshUrgencyLine, ...extras])].slice(0, 14),
    nextActions: [...report.practicalRecommendations.slice(0, 2), ...plan.nextActions].slice(0, 14),
    expectedEffect: `${plan.expectedEffect} ${t("hf.plan.effect")}`.slice(0, 500),
  };
}
