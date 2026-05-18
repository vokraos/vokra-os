import { pushHeroPlanComposerPayload } from "../hero-improvement-plan";
import type { HeroPromptArchetype } from "../prompt-composer/types";
import type { HeroBattlePlan } from "./types";

export function pushBattlePlanToComposer(plan: HeroBattlePlan, corridor: string, suggestedHeroArch: HeroPromptArchetype): void {
  pushHeroPlanComposerPayload({
    query: plan.query,
    marketplace: plan.marketplace,
    recommendedHeroDirection: `${plan.recommendedArchetype} · ${plan.refreshStrategy}`.slice(0, 600),
    promptDirection: plan.promptDirection,
    negativeConstraints: plan.negativeConstraints,
    corridor: corridor.trim() || "archive_luxury",
    suggestedHeroArch,
    garmentFocusLine: `${corridor}: ${plan.competitorFieldSummary}`.slice(0, 220),
    printFocusLine: `${plan.readabilityDirective}`.slice(0, 220),
    source: "battle_plan" as const,
  });
}
