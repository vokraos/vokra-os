import type { CompetitiveHeroImprovementPlan } from "../hero-improvement-plan/types";
import { newHeroImprovementPlanId } from "../hero-improvement-plan/ids";
import type { HeroReadabilityIntelligenceReport } from "./types";

export function mergeHeroPlanWithReadabilityIntel(
  plan: CompetitiveHeroImprovementPlan,
  report: HeroReadabilityIntelligenceReport,
  t: (key: string, vars?: Record<string, string>) => string,
): CompetitiveHeroImprovementPlan {
  const warn = report.readabilityRiskLine;
  const extras = report.practicalRecommendations.slice(0, 3);
  const readNote = t("hr.plan.augment", { line: report.readabilityGapLine.slice(0, 200) });
  return {
    ...plan,
    id: newHeroImprovementPlanId(),
    promptDirection: `${plan.promptDirection} · ${readNote}`.slice(0, 1200),
    negativeConstraints: `${plan.negativeConstraints} · ${t("hr.plan.neg", { line: warn.slice(0, 220) })}`.slice(0, 1600),
    riskFlags: [...new Set([...plan.riskFlags, warn, ...extras])].slice(0, 14),
    nextActions: [...report.practicalRecommendations.slice(0, 2), ...plan.nextActions].slice(0, 14),
    expectedEffect: `${plan.expectedEffect} ${t("hr.plan.effect")}`.slice(0, 500),
  };
}
