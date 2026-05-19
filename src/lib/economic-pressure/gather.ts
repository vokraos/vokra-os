import { buildAssortmentExecutionPlan } from "../assortment-actions/execution-plan";
import { deriveStructuralAssortmentActions } from "../assortment-actions/derive";
import { mergeStatusesIntoActions } from "../assortment-actions/storage";
import type { AssortmentAction } from "../assortment-actions/types";
import { deriveSnapshotIntelligence, getActiveEntitySnapshot } from "../entity-snapshot";
import type { SnapshotIntelligence } from "../entity-snapshot/intelligence";
import type { EntitySnapshot } from "../entity-snapshot/types";
import { peekHeroFatigueMapSession } from "../hero-command/peekSessions";
import { loadLatestLaunchReviewForCollection, peekLaunchOpsSession } from "../launch-ops";
import type { EconomicPressureGatherContext } from "./types";

export type EconomicPressureGatherOptions = {
  snapshot?: EntitySnapshot | null;
  intel?: SnapshotIntelligence | null;
  /** Structural actions only — never enriched assortment (breaks pressure → prioritization cycle). */
  structuralActions?: AssortmentAction[];
};

export function gatherEconomicPressureContext(
  options?: EconomicPressureGatherOptions,
): EconomicPressureGatherContext {
  const snapshot = options?.snapshot !== undefined ? options.snapshot : getActiveEntitySnapshot();
  const intel =
    options?.intel !== undefined
      ? options.intel
      : snapshot
        ? deriveSnapshotIntelligence(snapshot)
        : null;

  let executionPlan = null;
  let actionCount = 0;
  let activeActionCount = 0;

  if (snapshot && intel) {
    const structural =
      options?.structuralActions ?? deriveStructuralAssortmentActions(snapshot, intel);
    const merged = mergeStatusesIntoActions(structural, snapshot.id);
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
