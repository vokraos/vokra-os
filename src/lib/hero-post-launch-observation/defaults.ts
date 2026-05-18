import type { HeroLaunchPackage } from "../hero-launch-package/types";
import { newHeroPostLaunchObservationId } from "./ids";
import type { HeroPostLaunchObservation } from "./types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createObservationFromLaunchPackage(pkg: HeroLaunchPackage): HeroPostLaunchObservation {
  const now = todayIsoDate();
  return {
    id: newHeroPostLaunchObservationId(),
    sourceLaunchPackageId: pkg.id,
    sourceWinnerId: pkg.winningVariantId,
    query: pkg.query,
    marketplace: pkg.marketplace,
    launchDate: now,
    observationDate: now,
    observationWindowDays: 10,
    rankingObservation: "",
    competitorMovement: "",
    readabilityObservation: "",
    fatigueObservation: "",
    premiumPerceptionObservation: "",
    customerSignalObservation: "",
    operationalIssues: "",
    suspectedOutcome: "",
    nextRecommendation: "",
    refreshRisk: "",
    notes: "",
    learningReinforcement: [],
  };
}
