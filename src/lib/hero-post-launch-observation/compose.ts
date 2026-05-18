import type { HeroArchetypeIntelligenceReport } from "../hero-archetypes/types";
import type { HeroBattlePlan } from "../hero-battle-plan/types";
import type { HeroFatigueIntelligenceReport } from "../hero-fatigue/types";
import type { HeroReadabilityIntelligenceReport } from "../hero-readability/types";
import type { HeroLaunchPackage } from "../hero-launch-package/types";
import { createObservationFromLaunchPackage } from "./defaults";
import {
  deriveLearningReinforcement,
  deriveNextRecommendation,
  deriveRefreshRiskLabel,
} from "./learning";
import type { HeroPostLaunchObservation } from "./types";

export function buildHeroPostLaunchObservation(
  pkg: HeroLaunchPackage,
  draft: HeroPostLaunchObservation | null,
  ctx: {
    battlePlan: HeroBattlePlan | null;
    archetype: HeroArchetypeIntelligenceReport | null;
    readability: HeroReadabilityIntelligenceReport | null;
    fatigue: HeroFatigueIntelligenceReport | null;
  },
  t: (key: string) => string,
): HeroPostLaunchObservation {
  const base = draft ?? createObservationFromLaunchPackage(pkg);
  const learningReinforcement = deriveLearningReinforcement(
    { ...base, learningReinforcement: [] },
    ctx,
    t,
  );
  const nextRecommendation = deriveNextRecommendation(base, learningReinforcement, t);
  const refreshRisk = deriveRefreshRiskLabel(base, t);

  return {
    ...base,
    sourceLaunchPackageId: pkg.id,
    sourceWinnerId: pkg.winningVariantId,
    query: pkg.query,
    marketplace: pkg.marketplace,
    learningReinforcement,
    nextRecommendation: base.nextRecommendation.trim() ? base.nextRecommendation : nextRecommendation,
    refreshRisk: base.refreshRisk.trim() ? base.refreshRisk : refreshRisk,
  };
}

export function finalizeObservation(
  obs: HeroPostLaunchObservation,
  ctx: {
    battlePlan: HeroBattlePlan | null;
    archetype: HeroArchetypeIntelligenceReport | null;
    readability: HeroReadabilityIntelligenceReport | null;
    fatigue: HeroFatigueIntelligenceReport | null;
  },
  t: (key: string) => string,
): HeroPostLaunchObservation {
  const learningReinforcement = deriveLearningReinforcement(obs, ctx, t);
  return {
    ...obs,
    learningReinforcement,
    nextRecommendation: obs.nextRecommendation.trim()
      ? obs.nextRecommendation
      : deriveNextRecommendation(obs, learningReinforcement, t),
    refreshRisk: obs.refreshRisk.trim() ? obs.refreshRisk : deriveRefreshRiskLabel(obs, t),
  };
}
