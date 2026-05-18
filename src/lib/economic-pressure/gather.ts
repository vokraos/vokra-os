import {
  buildAssortmentExecutionPlan,
  deriveAssortmentActions,
  mergeStatusesIntoActions,
} from "../assortment-actions";
import { deriveSnapshotIntelligence, getActiveEntitySnapshot } from "../entity-snapshot";
import { peekHeroFatigueMapSession } from "../hero-command/peekSessions";
import { loadLatestLaunchReviewForCollection, peekLaunchOpsSession } from "../launch-ops";
import type { EconomicPressureGatherContext } from "./types";

export function gatherEconomicPressureContext(): EconomicPressureGatherContext {
  const snapshot = getActiveEntitySnapshot();
  const intel = snapshot ? deriveSnapshotIntelligence(snapshot) : null;

  let executionPlan = null;
  let actionCount = 0;
  let activeActionCount = 0;

  if (snapshot) {
    const merged = mergeStatusesIntoActions(deriveAssortmentActions(snapshot), snapshot.id);
    actionCount = merged.length;
    activeActionCount = merged.filter((a) => a.status !== "done" && a.status !== "rejected").length;
    executionPlan = buildAssortmentExecutionPlan(snapshot.id, merged);
  }

  const launchSession = peekLaunchOpsSession();
  const launchPlan = launchSession?.plan ?? null;
  const collectionId = launchPlan?.collectionId;
  const launchReview = collectionId
    ? loadLatestLaunchReviewForCollection(collectionId)
    : launchSession?.review ?? null;

  const fatigueSession = peekHeroFatigueMapSession();
  const heroFatigue = fatigueSession?.report ?? null;

  const visualFatigueHint = heroFatigue?.fatiguePressureIndex ?? 0;
  const seoSaturationHint = launchPlan
    ? launchPlan.saturationRisk && /seo/i.test(launchPlan.saturationRisk)
      ? 52
      : 0
    : 0;

  return {
    snapshot,
    intel,
    executionPlan,
    actionCount,
    activeActionCount,
    launchPlan,
    launchReview,
    heroFatigue,
    visualFatigueHint,
    seoSaturationHint,
  };
}
